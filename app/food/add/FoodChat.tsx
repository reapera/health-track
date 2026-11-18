"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import FoodForm from "@/components/food/FoodForm";
import Sheet from "@/components/food/Sheet";
import { dayLabel, fmt, localDate, shiftDate } from "@/lib/dates";
import { FOOD_MEALS, type NewFoodEntry } from "@/lib/food";
import type { HealthNote } from "@/lib/gemini";
import { usePasscode } from "@/lib/passcode-client";
import { chatFood, logFoods } from "./actions";

export interface RecentFood {
  foodItem: string;
  meal: string | null;
  calories: number;
  protein: number | null;
}

interface DraftItem {
  foodItem: string;
  meal: string;
  date: string;
  calories: string;
  protein: string;
  note: string;
}

interface Message {
  id: number;
  role: "user" | "assistant";
  text: string;
  items?: DraftItem[];
  health?: HealthNote | null;
  // Calories already saved that day when this proposal was made
  dayCalories?: number | null;
  status?: "pending" | "saving" | "logged" | "dismissed";
  error?: string;
}

const EXAMPLES = ["2 boiled eggs and a banana", "Nasi goreng and iced tea for lunch", "A slice of pepperoni pizza"];

function mealForNow(): string {
  const h = new Date().getHours();
  if (h < 10) return "Breakfast";
  if (h >= 11 && h < 15) return "Lunch";
  if (h >= 18 && h < 21) return "Dinner";
  return "Snack";
}

function toDraft(e: NewFoodEntry): DraftItem {
  return {
    foodItem: e.foodItem,
    meal: e.meal,
    date: e.date,
    calories: String(e.calories),
    protein: e.protein === null ? "" : String(e.protein),
    note: e.note,
  };
}

// What the model sees of earlier turns: proposals are flattened to text.
function historyText(m: Message): string {
  if (!m.items?.length) return m.text;
  const lines = m.items.map((i) => `- ${i.date} ${i.meal}: ${i.foodItem}, ${i.calories} kcal, ${i.protein || 0}g protein`);
  const status =
    m.status === "logged" ? "The user confirmed and these were saved." :
    m.status === "dismissed" ? "The user discarded this proposal." :
    "Awaiting confirmation; not saved yet.";
  const health = m.health ? `Health note shown: ${m.health.note}` : "";
  return [m.text, "Proposed entries:", ...lines, health, status].filter(Boolean).join("\n");
}

const noopSubscribe = () => () => {};

// Passcode and dates come from the device, so this renders on the client only.
export default function FoodChat(props: { initialDate?: string; recent: RecentFood[]; openManual?: boolean }) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return (
    <main className="h-dvh bg-neutral-950 text-white flex flex-col">
      {isClient ? <Chat {...props} /> : null}
    </main>
  );
}

function Chat({ initialDate, recent, openManual }: { initialDate?: string; recent: RecentFood[]; openManual?: boolean }) {
  const today = localDate();
  const yesterday = shiftDate(today, -1);
  const [logDate, setLogDate] = useState(initialDate && initialDate <= today ? initialDate : today);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [manualOpen, setManualOpen] = useState(!!openManual);
  const [manualKey, setManualKey] = useState(0);
  const [manualBusy, setManualBusy] = useState(false);
  const [manualError, setManualError] = useState("");
  const pass = usePasscode();
  const nextId = useRef(1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  const patch = (id: number, change: Partial<Message>) =>
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...change } : m)));

  const patchItem = (id: number, index: number, change: Partial<DraftItem>) =>
    setMessages((list) =>
      list.map((m) => (m.id === id ? { ...m, items: m.items?.map((it, i) => (i === index ? { ...it, ...change } : it)) } : m))
    );

  function removeItem(id: number, index: number) {
    setMessages((list) =>
      list.map((m) => {
        if (m.id !== id) return m;
        const items = m.items?.filter((_, i) => i !== index) ?? [];
        return { ...m, items, status: items.length ? m.status : "dismissed" };
      })
    );
  }

  function addRecent(food: RecentFood) {
    setMessages((list) => [
      ...list,
      {
        id: nextId.current++,
        role: "assistant",
        text: "",
        items: [{
          foodItem: food.foodItem,
          meal: food.meal && (FOOD_MEALS as readonly string[]).includes(food.meal) ? food.meal : mealForNow(),
          date: logDate,
          calories: String(food.calories),
          protein: food.protein == null ? "" : String(food.protein),
          note: "",
        }],
        status: "pending",
      },
    ]);
  }

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    if (!pass.passcode) {
      pass.require();
      setError("Enter your passcode first.");
      return;
    }
    const userMsg: Message = { id: nextId.current++, role: "user", text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setError("");
    setBusy(true);

    const time = new Date().toTimeString().slice(0, 5);
    let res;
    try {
      res = await chatFood(pass.passcode, history.map((m) => ({ role: m.role, text: historyText(m) })), today, time, logDate);
    } catch {
      res = { ok: false as const, error: "Network error. Try again." };
    }
    setBusy(false);
    pass.settle(res);

    if (!res.ok) {
      // Put the message back so it can be resent
      setMessages((list) => list.filter((m) => m.id !== userMsg.id));
      setInput(text);
      setError(res.error);
      return;
    }
    setMessages((list) => [
      ...list,
      {
        id: nextId.current++,
        role: "assistant",
        text: res.reply,
        items: res.items.length ? res.items.map(toDraft) : undefined,
        health: res.items.length ? res.health : null,
        dayCalories: res.dayCalories,
        status: res.items.length ? "pending" : undefined,
      },
    ]);
  }

  async function confirm(m: Message) {
    if (!m.items?.length) return;
    if (!pass.passcode) {
      pass.require();
      patch(m.id, { error: "Enter your passcode below first." });
      return;
    }
    patch(m.id, { status: "saving", error: undefined });
    let res;
    try {
      res = await logFoods(pass.passcode, m.items);
    } catch {
      res = { ok: false as const, error: "Network error. Try again.", logged: 0 };
    }
    pass.settle(res);
    if (res.ok) {
      patch(m.id, { status: "logged" });
      return;
    }
    // Drop the entries that did get saved so a retry can't duplicate them
    patch(m.id, { status: "pending", error: res.error, items: m.items.slice(res.logged) });
  }

  async function saveManual(v: DraftItem) {
    if (!pass.passcode) {
      pass.require();
      setManualError("Enter your passcode.");
      return;
    }
    setManualBusy(true);
    setManualError("");
    let res;
    try {
      res = await logFoods(pass.passcode, [v]);
    } catch {
      res = { ok: false as const, error: "Network error. Try again.", logged: 0 };
    }
    setManualBusy(false);
    pass.settle(res);
    if (!res.ok) {
      setManualError(res.error);
      return;
    }
    setManualOpen(false);
    setManualKey((k) => k + 1);
    setMessages((list) => [...list, { id: nextId.current++, role: "assistant", text: "", items: [v], status: "logged" }]);
  }

  const isPicked = logDate !== today && logDate !== yesterday;
  const chip = (active: boolean) =>
    `relative shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      active ? "bg-orange-500 text-white" : "bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-600"
    }`;

  return (
    <>
      <header className="w-full max-w-xl mx-auto px-4 pt-5 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Link href="/food" aria-label="Back to food log" className="h-10 w-10 -ml-2 grid place-items-center rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900">
            ←
          </Link>
          <h1 className="flex-1 text-xl font-semibold">Log food</h1>
          <button
            type="button"
            onClick={() => setManualOpen(true)}
            className="rounded-full border border-neutral-800 px-4 py-2 text-sm text-neutral-300 hover:border-neutral-600 hover:text-white"
          >
            Enter manually
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1" role="group" aria-label="Date to log for">
          <button type="button" className={chip(logDate === today)} aria-pressed={logDate === today} onClick={() => setLogDate(today)}>
            Today
          </button>
          <button type="button" className={chip(logDate === yesterday)} aria-pressed={logDate === yesterday} onClick={() => setLogDate(yesterday)}>
            Yesterday
          </button>
          <label className={`${chip(isPicked)} cursor-pointer`}>
            📅 {isPicked ? dayLabel(logDate, today) : "Other day"}
            {/* Invisible native picker over the chip, so the OS date UI opens on tap */}
            <input
              type="date"
              max={today}
              value={logDate}
              onChange={(e) => e.target.value && setLogDate(e.target.value)}
              aria-label="Pick a date"
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="w-full max-w-xl mx-auto px-4 py-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <div className="flex flex-col gap-6 pt-6">
              <div className="text-center flex flex-col gap-1">
                <p className="text-2xl font-semibold">What did you eat?</p>
                <p className="text-neutral-400 text-sm">
                  Describe it and I’ll estimate calories and protein. Nothing is saved until you confirm.
                </p>
              </div>

              {recent.length > 0 && (
                <section className="flex flex-col gap-2">
                  <h2 className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Log again</h2>
                  <div className="flex flex-wrap gap-2">
                    {recent.map((f) => (
                      <button
                        key={f.foodItem}
                        type="button"
                        onClick={() => addRecent(f)}
                        className="rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-orange-500/60 px-3.5 py-2 text-left text-sm"
                      >
                        <span className="text-white">{f.foodItem}</span>
                        <span className="text-neutral-500 tabular-nums"> · {fmt(f.calories)}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              <section className="flex flex-col gap-2">
                <h2 className="text-xs uppercase tracking-wider text-neutral-500 font-medium">Try</h2>
                <div className="flex flex-col gap-2">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => {
                        setInput(ex);
                        inputRef.current?.focus();
                      }}
                      className="rounded-2xl border border-dashed border-neutral-800 hover:border-neutral-600 px-4 py-3 text-left text-sm text-neutral-400"
                    >
                      “{ex}”
                    </button>
                  ))}
                </div>
              </section>
            </div>
          )}

          {messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="self-end max-w-[85%] bg-orange-500 text-white rounded-3xl rounded-br-lg px-4 py-2.5 text-[15px] whitespace-pre-wrap">
                {m.text}
              </div>
            ) : (
              <div key={m.id} className="self-start w-full flex flex-col gap-2">
                {m.text && (
                  <div className="self-start max-w-[85%] bg-neutral-900 rounded-3xl rounded-bl-lg px-4 py-2.5 text-[15px] text-neutral-200 whitespace-pre-wrap">
                    {m.text}
                  </div>
                )}
                {m.items && m.items.length > 0 && (
                  <Proposal
                    m={m}
                    today={today}
                    onItem={(i, c) => patchItem(m.id, i, c)}
                    onRemove={(i) => removeItem(m.id, i)}
                    onDiscard={() => patch(m.id, { status: "dismissed" })}
                    onConfirm={() => confirm(m)}
                  />
                )}
                {m.items && m.items.length === 0 && m.status === "dismissed" && (
                  <p className="text-neutral-500 text-sm px-1">Discarded</p>
                )}
              </div>
            )
          )}

          {busy && (
            <div className="self-start bg-neutral-900 rounded-3xl rounded-bl-lg px-4 py-3 flex gap-1" aria-label="Estimating">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 rounded-full bg-neutral-500 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="w-full max-w-xl mx-auto px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-2">
        {error && <p role="alert" className="text-red-400 text-sm px-1">{error}</p>}
        {pass.needed && (
          <input
            type="password"
            value={pass.passcode}
            onChange={(e) => pass.setPasscode(e.target.value)}
            placeholder="Passcode (asked once on this device)"
            aria-label="Passcode"
            autoComplete="current-password"
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl px-4 py-3 text-base placeholder-neutral-500 focus:outline-none focus:border-orange-400"
          />
        )}
        <form onSubmit={send} className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full pl-5 pr-1.5 py-1.5 focus-within:border-orange-400">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={logDate === today ? "What did you eat?" : `What did you eat ${dayLabel(logDate, today).toLowerCase() === "yesterday" ? "yesterday" : `on ${dayLabel(logDate, today)}`}?`}
            aria-label="What did you eat?"
            autoComplete="off"
            maxLength={2000}
            className="flex-1 min-w-0 bg-transparent py-2 text-base placeholder-neutral-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send"
            className="h-10 w-10 shrink-0 grid place-items-center rounded-full bg-orange-500 hover:bg-orange-400 disabled:bg-neutral-800 disabled:text-neutral-600 transition-colors"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M10 3.5a1 1 0 0 1 .7.3l5 5a1 1 0 1 1-1.4 1.4L11 6.9V16a1 1 0 1 1-2 0V6.9L5.7 10.2a1 1 0 0 1-1.4-1.4l5-5a1 1 0 0 1 .7-.3z" />
            </svg>
          </button>
        </form>
      </div>

      <Sheet open={manualOpen} onClose={() => { setManualOpen(false); setManualError(""); }} title="Enter manually">
        <FoodForm
          key={`${manualKey}-${logDate}`}
          initial={{ foodItem: "", meal: mealForNow(), date: logDate, calories: "", protein: "", note: "" }}
          submitLabel="Log it"
          busy={manualBusy}
          error={manualError}
          passcode={pass.needed ? { value: pass.passcode, onChange: pass.setPasscode } : null}
          onSubmit={saveManual}
        />
      </Sheet>
    </>
  );
}

function Proposal({
  m,
  today,
  onItem,
  onRemove,
  onDiscard,
  onConfirm,
}: {
  m: Message;
  today: string;
  onItem: (i: number, c: Partial<DraftItem>) => void;
  onRemove: (i: number) => void;
  onDiscard: () => void;
  onConfirm: () => void;
}) {
  const items = m.items ?? [];
  const locked = m.status !== "pending";
  const total = items.reduce((s, it) => s + (Number(it.calories) || 0), 0);
  const small =
    "w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-base text-white focus:outline-none focus:border-orange-400 disabled:opacity-60 disabled:border-transparent";

  return (
    <div className={`rounded-3xl border p-4 flex flex-col gap-3 ${m.status === "logged" ? "bg-neutral-900/60 border-emerald-900/60" : "bg-neutral-900 border-neutral-800"}`}>
      <ul className="flex flex-col divide-y divide-neutral-800">
        {items.map((it, i) => (
          <li key={i} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-white">{it.foodItem}</p>
                {it.date !== today && <p className="text-xs text-orange-300">{dayLabel(it.date, today)}</p>}
              </div>
              {!locked && (
                <button type="button" onClick={() => onRemove(i)} aria-label={`Remove ${it.foodItem}`} className="h-8 w-8 -mr-1 -mt-1 grid place-items-center rounded-full text-neutral-500 hover:text-white hover:bg-neutral-800">
                  ✕
                </button>
              )}
            </div>
            <div className="grid grid-cols-[1fr_1.15fr_0.85fr] gap-2">
              <select value={it.meal} disabled={locked} onChange={(e) => onItem(i, { meal: e.target.value })} aria-label="Meal" className={small}>
                {(FOOD_MEALS as readonly string[]).includes(it.meal) ? null : <option value={it.meal}>{it.meal}</option>}
                {FOOD_MEALS.map((meal) => (
                  <option key={meal} value={meal}>{meal}</option>
                ))}
              </select>
              <label className="relative">
                <input type="number" inputMode="decimal" min={0} value={it.calories} disabled={locked} onChange={(e) => onItem(i, { calories: e.target.value })} aria-label="Calories" className={`${small} pr-10 text-right tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`} />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500 pointer-events-none">kcal</span>
              </label>
              <label className="relative">
                <input type="number" inputMode="decimal" min={0} value={it.protein} disabled={locked} onChange={(e) => onItem(i, { protein: e.target.value })} aria-label="Protein in grams" placeholder="—" className={`${small} pr-6 text-right tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none`} />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-neutral-500 pointer-events-none">g</span>
              </label>
            </div>
          </li>
        ))}
      </ul>

      {m.health && (
        <div
          role="note"
          className={`flex gap-2.5 rounded-2xl px-3.5 py-3 text-sm ${
            m.health.level === "warning" ? "bg-red-500/10 text-red-200 ring-1 ring-red-500/30" : "bg-yellow-400/10 text-yellow-100 ring-1 ring-yellow-400/25"
          }`}
        >
          <span aria-hidden>{m.health.level === "warning" ? "⚠️" : "💡"}</span>
          <span>{m.health.note}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="flex-1 leading-tight">
          <p className="font-semibold tabular-nums">{fmt(total)} kcal</p>
          {m.dayCalories != null && (
            <p className="text-xs text-neutral-500 tabular-nums">Day total → {fmt(m.dayCalories + total)} kcal</p>
          )}
        </div>
        {m.status === "pending" && (
          <>
            <button type="button" onClick={onDiscard} className="px-3 py-2.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800">
              Discard
            </button>
            <button type="button" onClick={onConfirm} className="rounded-xl bg-orange-500 hover:bg-orange-400 px-5 py-2.5 font-semibold transition-colors">
              Log {items.length > 1 ? `${items.length} items` : "it"}
            </button>
          </>
        )}
        {m.status === "saving" && <span className="text-neutral-400 text-sm">Saving…</span>}
        {m.status === "logged" && <span className="text-emerald-400 text-sm font-medium">✓ Logged</span>}
        {m.status === "dismissed" && <span className="text-neutral-500 text-sm">Discarded</span>}
      </div>
      {m.error && <p role="alert" className="text-red-400 text-sm">{m.error}</p>}
    </div>
  );
}
