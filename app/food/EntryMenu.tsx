"use client";

import { useState } from "react";
import FoodForm, { type FoodFormValues } from "@/components/food/FoodForm";
import Sheet from "@/components/food/Sheet";
import { fmt, localDate } from "@/lib/dates";
import type { FoodEntry } from "@/lib/notion";
import { usePasscode } from "@/lib/passcode-client";
import { deleteFood, logFoods, updateFood } from "./add/actions";

type Mode = "menu" | "edit" | "delete";

// A deliberate ⋯ button per entry: nothing changes until an action is picked in the sheet.
export default function EntryMenu({ entry }: { entry: FoodEntry }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const pass = usePasscode();
  const name = entry.foodItem || entry.name || "Entry";

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Options for ${name}`}
        className="h-11 w-11 -mr-2 shrink-0 grid place-items-center rounded-full text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {flash && (
        <span role="status" className="absolute right-12 top-1/2 -translate-y-1/2 text-xs text-emerald-400 bg-neutral-900 px-2 py-1 rounded-lg">
          {flash}
        </span>
      )}

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
    </>
  );
}
