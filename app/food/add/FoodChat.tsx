"use client";

import { rememberPasscode as storePasscode, savedPasscode } from "@/lib/passcode-client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { FOOD_MEALS, type NewFoodEntry } from "@/lib/food";
import { chatFood, logFoods } from "./actions";

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
  status?: "pending" | "saving" | "logged" | "dismissed";
  error?: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function localNow() {
  const d = new Date();
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
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
  return [m.text, "Proposed entries:", ...lines, status].filter(Boolean).join("\n");
}

const noopSubscribe = () => () => {};

// Passcode and date defaults come from the device, so the chat renders on the client only.
export default function FoodChat({ initialDate }: { initialDate?: string }) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return isClient ? <Chat initialDate={initialDate} /> : null;
}

function Chat({ initialDate }: { initialDate?: string }) {
  const today = localNow().date;
  const [logDate, setLogDate] = useState(initialDate && initialDate <= today ? initialDate : today);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [passcode, setPasscode] = useState(savedPasscode);
  const [askPasscode, setAskPasscode] = useState(() => !savedPasscode());
  const nextId = useRef(1);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  function rememberPasscode() {
    setAskPasscode(false);
    storePasscode(passcode);
  }

  function patch(id: number, change: Partial<Message>) {
    setMessages((list) => list.map((m) => (m.id === id ? { ...m, ...change } : m)));
  }

  function patchItem(id: number, index: number, change: Partial<DraftItem>) {
    setMessages((list) =>
      list.map((m) =>
        m.id === id ? { ...m, items: m.items?.map((it, i) => (i === index ? { ...it, ...change } : it)) } : m
      )
    );
  }

  function removeItem(id: number, index: number) {
    setMessages((list) =>
      list.map((m) => {
        if (m.id !== id) return m;
        const items = m.items?.filter((_, i) => i !== index) ?? [];
        return { ...m, items, status: items.length ? m.status : "dismissed" };
      })
    );
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
    if (!passcode) {
      setAskPasscode(true);
      setError("Enter your passcode first.");
      return;
    }

    const userMsg: Message = { id: nextId.current++, role: "user", text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setError("");
    setBusy(true);

    const { date, time } = localNow();
    let res;
    try {
      res = await chatFood(passcode, history.map((m) => ({ role: m.role, text: historyText(m) })), date, time, logDate);
    } catch {
      res = { ok: false as const, error: "Network error. Try again." };
    }
    setBusy(false);

    if (!res.ok) {
      // Put the message back so it can be resent
      setMessages((list) => list.filter((m) => m.id !== userMsg.id));
      setInput(text);
      setError(res.error);
      if ("auth" in res && res.auth) setAskPasscode(true);
      return;
    }
    rememberPasscode();
    setMessages((list) => [
      ...list,
      {
        id: nextId.current++,
        role: "assistant",
        text: res.reply,
        items: res.items.length ? res.items.map(toDraft) : undefined,
        status: res.items.length ? "pending" : undefined,
      },
    ]);
  }

  async function confirm(m: Message) {
    if (!m.items?.length) return;
    patch(m.id, { status: "saving", error: undefined });
    let res;
    try {
      res = await logFoods(passcode, m.items);
    } catch {
      res = { ok: false as const, error: "Network error. Try again.", logged: 0 };
    }
    if (res.ok) {
      patch(m.id, { status: "logged" });
      return;
    }
    if ("auth" in res && res.auth) setAskPasscode(true);
    // Drop the entries that did get saved so a retry can't duplicate them
    patch(m.id, { status: "pending", error: res.error, items: m.items.slice(res.logged) });
  }

  const numClass =
    "w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-base text-white text-right focus:outline-none focus:border-amber-400 disabled:opacity-60";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pb-4">
        {messages.length === 0 && (
          <div className="m-auto text-center text-gray-500 text-sm px-6 flex flex-col gap-2">
            <p className="text-gray-300 text-base">What did you eat?</p>
            <p>e.g. “nasi goreng and iced tea for lunch” or “2 boiled eggs and a banana”</p>
            <p>I’ll estimate calories and protein, and you confirm before it’s saved to Notion.</p>
          </div>
        )}

        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="self-end max-w-[85%] bg-amber-400 text-gray-950 rounded-2xl rounded-br-md px-4 py-2.5 text-sm whitespace-pre-wrap">
              {m.text}
            </div>
          ) : (
            <div key={m.id} className="self-start w-full max-w-[95%] flex flex-col gap-2">
              {m.text && (
                <div className="self-start bg-gray-900 border border-gray-800 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-gray-200 whitespace-pre-wrap">
                  {m.text}
                </div>
              )}

              {m.items && m.items.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-3">
                  {m.items.map((it, i) => {
                    const locked = m.status !== "pending";
                    return (
                      <div key={i} className="flex flex-col gap-2 border-b border-gray-800 pb-3 last:border-0 last:pb-0">
                        <div className="flex items-start gap-2">
                          <p className="flex-1 text-sm text-white">{it.foodItem}</p>
                          {!locked && (
                            <button
                              type="button"
                              onClick={() => removeItem(m.id, i)}
                              aria-label={`Remove ${it.foodItem}`}
                              className="text-gray-500 hover:text-white text-sm px-1"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-2 items-end">
                          <label className="flex flex-col gap-1">
                            <span className="text-gray-500 text-[11px] uppercase tracking-wide">{it.date}</span>
                            <select
                              value={it.meal}
                              disabled={locked}
                              onChange={(e) => patchItem(m.id, i, { meal: e.target.value })}
                              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-base text-white focus:outline-none focus:border-amber-400 disabled:opacity-60"
                            >
                              {FOOD_MEALS.map((meal) => (
                                <option key={meal} value={meal}>{meal}</option>
                              ))}
                            </select>
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-gray-500 text-[11px] uppercase tracking-wide">kcal</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              value={it.calories}
                              disabled={locked}
                              onChange={(e) => patchItem(m.id, i, { calories: e.target.value })}
                              className={numClass}
                            />
                          </label>
                          <label className="flex flex-col gap-1">
                            <span className="text-gray-500 text-[11px] uppercase tracking-wide">Protein g</span>
                            <input
                              type="number"
                              inputMode="decimal"
                              min={0}
                              value={it.protein}
                              disabled={locked}
                              onChange={(e) => patchItem(m.id, i, { protein: e.target.value })}
                              className={numClass}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-gray-400 flex-1">
                      Total {m.items.reduce((s, it) => s + (Number(it.calories) || 0), 0)} kcal
                    </span>
                    {m.status === "pending" && (
                      <>
                        <button
                          type="button"
                          onClick={() => patch(m.id, { status: "dismissed" })}
                          className="text-gray-400 hover:text-white px-2 py-2"
                        >
                          Discard
                        </button>
                        <button
                          type="button"
                          onClick={() => confirm(m)}
                          className="bg-amber-400 text-gray-950 font-semibold rounded-xl px-4 py-2 hover:opacity-80 transition-opacity"
                        >
                          Log {m.items.length} {m.items.length === 1 ? "item" : "items"}
                        </button>
                      </>
                    )}
                    {m.status === "saving" && <span className="text-gray-400">Saving…</span>}
                    {m.status === "logged" && <span className="text-green-400">✓ Saved to Notion</span>}
                    {m.status === "dismissed" && <span className="text-gray-500">Discarded</span>}
                  </div>
                  {m.error && <p role="alert" className="text-red-400 text-sm">{m.error}</p>}
                </div>
              )}

              {m.items && m.items.length === 0 && m.status === "dismissed" && (
                <p className="text-gray-500 text-sm px-1">Discarded</p>
              )}
            </div>
          )
        )}

        {busy && (
          <div className="self-start bg-gray-900 border border-gray-800 rounded-2xl rounded-bl-md px-4 py-2.5 text-sm text-gray-500">
            Estimating…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex flex-col gap-2 pb-4 pt-2 border-t border-gray-900">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <span>Logging for</span>
          <input
            type="date"
            value={logDate}
            max={today}
            onChange={(e) => setLogDate(e.target.value || today)}
            className={`bg-gray-900 border rounded-lg px-2 py-1 text-base focus:outline-none focus:border-amber-400 ${
              logDate === today ? "border-gray-800 text-gray-300" : "border-amber-400 bg-amber-400/15 text-amber-200 font-medium"
            }`}
          />
          {logDate === today ? (
            <span className="text-gray-500">Today</span>
          ) : (
            <button type="button" onClick={() => setLogDate(today)} className="text-gray-500 hover:text-white underline underline-offset-2">
              Back to today
            </button>
          )}
        </label>
        {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
        {askPasscode && (
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            aria-label="Passcode"
            autoComplete="current-password"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-base text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          />
        )}
        <form onSubmit={send} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="What did you eat?"
            aria-label="What did you eat?"
            autoComplete="off"
            maxLength={2000}
            className="flex-1 min-w-0 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="bg-amber-400 text-gray-950 font-semibold rounded-xl px-5 disabled:opacity-50 transition-opacity"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
