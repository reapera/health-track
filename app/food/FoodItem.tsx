"use client";

import { useState } from "react";
import { FOOD_MEALS } from "@/lib/food";
import type { FoodEntry } from "@/lib/notion";
import { rememberPasscode, savedPasscode } from "@/lib/passcode-client";
import { deleteFood, updateFood } from "./add/actions";

const inputClass =
  "w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-base text-white placeholder-gray-500 focus:outline-none focus:border-amber-400";
const labelClass = "flex flex-col gap-1 text-gray-500 text-[11px] uppercase tracking-wide";

export default function FoodItem({ entry }: { entry: FoodEntry }) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group flex items-center gap-3 text-sm text-left -mx-2 px-2 py-1 rounded-lg hover:bg-gray-800/60 transition-colors"
        aria-label={`Edit ${entry.foodItem || entry.name || "entry"}`}
      >
        <span className="text-white flex-1">{entry.foodItem || entry.name || "—"}</span>
        <span className="text-gray-500 text-xs">{entry.calories != null ? `${entry.calories} kcal` : ""}</span>
        <span className="text-gray-500 text-xs w-10 text-right">{entry.protein != null ? `${entry.protein}g` : ""}</span>
        <span className="text-gray-600 group-hover:text-amber-300 text-xs" aria-hidden>✎</span>
      </button>
    );
  }
  return <EditForm entry={entry} onClose={() => setEditing(false)} />;
}

function EditForm({ entry, onClose }: { entry: FoodEntry; onClose: () => void }) {
  const [food, setFood] = useState(entry.foodItem || entry.name);
  const [meal, setMeal] = useState(entry.meal ?? "");
  const [calories, setCalories] = useState(entry.calories?.toString() ?? "");
  const [protein, setProtein] = useState(entry.protein?.toString() ?? "");
  const [date, setDate] = useState(entry.date);
  const [note, setNote] = useState(entry.note);
  const [passcode, setPasscode] = useState(savedPasscode);
  const [askPasscode, setAskPasscode] = useState(() => !savedPasscode());
  const [busy, setBusy] = useState<"" | "save" | "delete">("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState("");

  // Keep an older Notion meal option selectable if this entry uses one
  const meals: string[] = entry.meal && !FOOD_MEALS.includes(entry.meal as never) ? [...FOOD_MEALS, entry.meal] : [...FOOD_MEALS];

  async function run(kind: "save" | "delete") {
    if (!passcode) {
      setAskPasscode(true);
      setError("Enter your passcode first.");
      return;
    }
    setBusy(kind);
    setError("");
    let res;
    try {
      res =
        kind === "save"
          ? await updateFood(passcode, entry.id, { foodItem: food, meal, calories, protein, date, note })
          : await deleteFood(passcode, entry.id);
    } catch {
      res = { ok: false as const, error: "Network error. Try again." };
    }
    setBusy("");
    if (res.ok) {
      rememberPasscode(passcode);
      // The server action refreshes the page with the new data
      onClose();
      return;
    }
    setError(res.error);
    setConfirmDelete(false);
    if ("auth" in res && res.auth) setAskPasscode(true);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run("save");
      }}
      className="bg-gray-950 border border-amber-500/40 rounded-xl p-3 flex flex-col gap-3 my-1"
    >
      <label className={labelClass}>
        Food
        <input value={food} onChange={(e) => setFood(e.target.value)} required maxLength={200} className={inputClass} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className={labelClass}>
          Meal
          <select value={meal} onChange={(e) => setMeal(e.target.value)} required className={inputClass}>
            {!meal && <option value="">Pick…</option>}
            {meals.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputClass} />
        </label>
        <label className={labelClass}>
          kcal
          <input type="number" inputMode="decimal" min={0} step="any" value={calories} onChange={(e) => setCalories(e.target.value)} required className={inputClass} />
        </label>
        <label className={labelClass}>
          Protein g
          <input type="number" inputMode="decimal" min={0} step="any" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="optional" className={inputClass} />
        </label>
      </div>
      <label className={labelClass}>
        Note
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="optional" className={inputClass} />
      </label>
      {askPasscode && (
        <label className={labelClass}>
          Passcode
          <input type="password" value={passcode} onChange={(e) => setPasscode(e.target.value)} autoComplete="current-password" className={inputClass} />
        </label>
      )}
      {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}
      <div className="flex items-center gap-2 text-sm">
        {confirmDelete ? (
          <>
            <span className="text-red-300 flex-1">Delete this entry?</span>
            <button type="button" onClick={() => setConfirmDelete(false)} disabled={!!busy} className="text-gray-400 hover:text-white px-3 py-2">
              Keep
            </button>
            <button type="button" onClick={() => run("delete")} disabled={!!busy} className="bg-red-500 text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50">
              {busy === "delete" ? "Deleting…" : "Delete"}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={() => setConfirmDelete(true)} disabled={!!busy} className="text-red-400 hover:text-red-300 px-1 py-2 mr-auto">
              Delete
            </button>
            <button type="button" onClick={onClose} disabled={!!busy} className="text-gray-400 hover:text-white px-3 py-2">
              Cancel
            </button>
            <button type="submit" disabled={!!busy} className="bg-amber-400 text-gray-950 font-semibold rounded-lg px-4 py-2 disabled:opacity-50">
              {busy === "save" ? "Saving…" : "Save"}
            </button>
          </>
        )}
      </div>
    </form>
  );
}
