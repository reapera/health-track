"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import FoodForm, { type FoodFormValues } from "@/components/food/FoodForm";
import Sheet from "@/components/food/Sheet";
import { fmt, localDate } from "@/lib/dates";
import type { FoodEntry } from "@/lib/notion";
import { usePasscode } from "@/lib/passcode-client";
import { deleteFood, logFoods, updateFood } from "./add/actions";

type Mode = "menu" | "edit" | "delete";

const SWIPED_KEY = "health-track-swiped";
const THRESHOLD = 80; // px of horizontal drag needed to trigger an action

function markSwiped() {
  try {
    localStorage.setItem(SWIPED_KEY, "1");
    window.dispatchEvent(new Event("health-track-swiped"));
  } catch {}
}

// Shown on touch screens until the first successful swipe
export function SwipeHint() {
  const seen = useSyncExternalStore(
    (cb) => {
      window.addEventListener("health-track-swiped", cb);
      return () => window.removeEventListener("health-track-swiped", cb);
    },
    () => {
      try {
        return localStorage.getItem(SWIPED_KEY) === "1";
      } catch {
        return true;
      }
    },
    () => true
  );
  if (seen) return null;
  return (
    <p className="hidden pointer-coarse:block text-center text-xs text-neutral-500 pb-3 -mt-1">
      Swipe an item right to edit · left for more
    </p>
  );
}

// Horizontal swipe on a row: right opens Edit, left opens the menu. Vertical drags are left
// to the page so scrolling never moves a row. Taps do nothing.
function useSwipe(onRight: () => void, onLeft: () => void) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; id: number; locked: boolean } | null>(null);
  const crossed = useRef(false);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    start.current = { x: e.clientX, y: e.clientY, id: e.pointerId, locked: false };
    crossed.current = false;
  }

  function onPointerMove(e: React.PointerEvent) {
    const s = start.current;
    if (!s || s.id !== e.pointerId) return;
    const mx = e.clientX - s.x;
    const my = e.clientY - s.y;
    if (!s.locked) {
      if (Math.abs(my) > 10 && Math.abs(my) > Math.abs(mx)) {
        start.current = null; // vertical: let the page scroll
        return;
      }
      if (Math.abs(mx) < 10) return;
      s.locked = true;
      setDragging(true);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    // Rubber-band past the threshold so the row never flies off
    const sign = Math.sign(mx);
    const abs = Math.abs(mx);
    const eased = abs <= THRESHOLD ? abs : THRESHOLD + (abs - THRESHOLD) * 0.35;
    const next = sign * Math.min(eased, 140);
    if (Math.abs(next) >= THRESHOLD !== crossed.current) {
      crossed.current = Math.abs(next) >= THRESHOLD;
      if (crossed.current) navigator.vibrate?.(8);
    }
    setDx(next);
  }

  function end(fire: boolean) {
    const s = start.current;
    start.current = null;
    if (s?.locked && fire && crossed.current) {
      markSwiped();
      if (dx > 0) onRight();
      else onLeft();
    }
    crossed.current = false;
    setDragging(false);
    setDx(0);
  }

  return {
    dx,
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: () => end(true),
      onPointerCancel: () => end(false),
    },
  };
}

export default function EntryRow({ entry }: { entry: FoodEntry }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const pass = usePasscode();
  const name = entry.foodItem || entry.name || "Entry";
  const openAs = (m: Mode) => {
    setMode(m);
    setOpen(true);
  };
  const swipe = useSwipe(() => openAs("edit"), () => openAs("menu"));
  const ai = entry.note === "AI estimate";
  const note = ai ? "" : entry.note;

  function close() {
    setOpen(false);
    setMode("menu");
    setError("");
  }

  async function run(action: () => Promise<{ ok: boolean; error?: string; auth?: boolean }>, done: string) {
    if (!pass.passcode) {
      pass.require();
      setError("Enter your passcode first.");
      if (mode === "menu") setMode("edit");
      return;
    }
    setBusy(true);
    setError("");
    let res: { ok: boolean; error?: string; auth?: boolean };
    try {
      res = await action();
    } catch {
      res = { ok: false, error: "Network error. Try again." };
    }
    setBusy(false);
    pass.settle(res);
    if (res.ok) {
      close();
      setFlash(done);
      setTimeout(() => setFlash(""), 2500);
    } else {
      setError(res.error ?? "Something went wrong.");
    }
  }

  const initial: FoodFormValues = {
    foodItem: name,
    meal: entry.meal ?? "",
    date: entry.date,
    calories: entry.calories?.toString() ?? "",
    protein: entry.protein?.toString() ?? "",
    note: entry.note,
  };

  const asNew = () => ({
    foodItem: name,
    meal: entry.meal ?? "Snack",
    date: localDate(),
    calories: entry.calories ?? 0,
    protein: entry.protein,
    note: entry.note,
  });

  const passField = pass.needed ? { value: pass.passcode, onChange: pass.setPasscode } : null;
  const menuButton =
    "w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-base bg-neutral-800/70 hover:bg-neutral-800 transition-colors disabled:opacity-50";

  const reveal = Math.min(1, Math.abs(swipe.dx) / THRESHOLD);
  const armed = Math.abs(swipe.dx) >= THRESHOLD;

  return (
    <li className="relative -mx-5 overflow-hidden">
      {/* Action panels revealed behind the row while dragging */}
      {swipe.dx !== 0 && (
        <div aria-hidden className="absolute inset-0 flex">
          {swipe.dx > 0 ? (
            <div className={`flex-1 flex items-center pl-6 gap-2 font-semibold transition-colors ${armed ? "bg-orange-500 text-white" : "bg-orange-500/30 text-orange-100"}`}>
              <span style={{ transform: `scale(${0.7 + reveal * 0.3})` }}>✏️</span> Edit
            </div>
          ) : (
            <div className={`flex-1 flex items-center justify-end pr-6 gap-2 font-semibold transition-colors ${armed ? "bg-neutral-600 text-white" : "bg-neutral-700/60 text-neutral-200"}`}>
              More <span style={{ transform: `scale(${0.7 + reveal * 0.3})` }}>⋯</span>
            </div>
          )}
        </div>
      )}

      <div
        {...swipe.handlers}
        style={{ transform: `translateX(${swipe.dx}px)`, transition: swipe.dragging ? "none" : "transform 200ms ease-out" }}
        className="relative flex items-center gap-3 py-2.5 px-5 bg-neutral-900 touch-pan-y select-none"
      >
        <div className="flex-1 min-w-0">
          <p className="text-[15px] text-white truncate">{name}</p>
          <p className="text-xs text-neutral-500 truncate">
            {entry.protein != null ? `${entry.protein} g protein` : "protein —"}
            {ai && " · AI estimate"}
            {note && ` · ${note}`}
          </p>
        </div>
        {flash ? (
          <p role="status" className="text-xs text-emerald-400 whitespace-nowrap">{flash}</p>
        ) : (
          <p className="text-[15px] font-medium tabular-nums text-neutral-200 whitespace-nowrap">
            {entry.calories != null ? fmt(entry.calories) : "—"}
            <span className="text-neutral-500 text-xs font-normal"> kcal</span>
          </p>
        )}
        {/* Mouse users get a button; on touch screens it stays available to screen readers only */}
        <button
          type="button"
          onClick={() => openAs("menu")}
          aria-label={`Options for ${name}`}
          className="pointer-coarse:sr-only h-10 w-10 -mr-2 shrink-0 grid place-items-center rounded-full text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <circle cx="5" cy="12" r="1.8" />
            <circle cx="12" cy="12" r="1.8" />
            <circle cx="19" cy="12" r="1.8" />
          </svg>
        </button>
      </div>

      <Sheet open={open} onClose={close} title={mode === "edit" ? "Edit entry" : name}>
        {mode === "menu" && (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-neutral-400 -mt-2 mb-2">
              {entry.meal ?? "No meal"} · {entry.calories != null ? `${fmt(entry.calories)} kcal` : "no kcal"}
              {entry.protein != null ? ` · ${entry.protein} g protein` : ""}
            </p>
            <button type="button" className={menuButton} onClick={() => setMode("edit")}>
              <span aria-hidden className="w-6 text-center">✏️</span> Edit
            </button>
            <button type="button" className={menuButton} disabled={busy} onClick={() => run(() => logFoods(pass.passcode, [asNew()]), "Logged for today")}>
              <span aria-hidden className="w-6 text-center">↻</span> {busy ? "Logging…" : "Log again today"}
            </button>
            <button type="button" className={`${menuButton} text-red-400`} onClick={() => setMode("delete")}>
              <span aria-hidden className="w-6 text-center">🗑</span> Delete
            </button>
            {error && <p role="alert" className="text-red-400 text-sm mt-1">{error}</p>}
          </div>
        )}

        {mode === "edit" && (
          <FoodForm
            initial={initial}
            submitLabel="Save changes"
            busy={busy}
            error={error}
            passcode={passField}
            onSubmit={(v) => run(() => updateFood(pass.passcode, entry.id, v), "Saved")}
            secondary={
              <button type="button" onClick={() => { setMode("menu"); setError(""); }} className="px-4 rounded-xl text-neutral-300 hover:bg-neutral-800">
                Back
              </button>
            }
          />
        )}

        {mode === "delete" && (
          <div className="flex flex-col gap-4">
            <p className="text-neutral-300">
              Delete <span className="font-semibold text-white">{name}</span> from {entry.date}? It moves to Notion’s trash, where you can restore it.
            </p>
            {pass.needed && (
              <input
                type="password"
                value={pass.passcode}
                onChange={(e) => pass.setPasscode(e.target.value)}
                placeholder="Passcode"
                aria-label="Passcode"
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-3 text-base focus:outline-none focus:border-orange-400"
              />
            )}
            {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => { setMode("menu"); setError(""); }} className="flex-1 rounded-xl py-3.5 bg-neutral-800 hover:bg-neutral-700">
                Keep it
              </button>
              <button type="button" disabled={busy} onClick={() => run(() => deleteFood(pass.passcode, entry.id), "Deleted")} className="flex-1 rounded-xl py-3.5 bg-red-600 hover:bg-red-500 font-semibold disabled:opacity-50">
                {busy ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </li>
  );
}
