"use client";

import { useState } from "react";
import { FOOD_MEALS } from "@/lib/food";

export interface FoodFormValues {
  foodItem: string;
  meal: string;
  date: string;
  calories: string;
  protein: string;
  note: string;
}

export const fieldClass =
  "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-3 text-base text-white placeholder-neutral-500 focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400";
const labelClass = "flex flex-col gap-1.5 text-xs font-medium text-neutral-400";

// Controlled entry form shared by "edit" and "add manually".
export default function FoodForm({
  initial,
  submitLabel,
  busy,
  error,
  passcode,
  onSubmit,
  secondary,
}: {
  initial: FoodFormValues;
  submitLabel: string;
  busy: boolean;
  error: string;
  passcode?: { value: string; onChange: (v: string) => void } | null;
  onSubmit: (values: FoodFormValues) => void;
  secondary?: React.ReactNode;
}) {
  const [v, setV] = useState(initial);
  const set = (change: Partial<FoodFormValues>) => setV((prev) => ({ ...prev, ...change }));
  // Keep an older Notion meal option selectable when an entry uses one
  const meals: string[] = initial.meal && !(FOOD_MEALS as readonly string[]).includes(initial.meal)
    ? [...FOOD_MEALS, initial.meal]
    : [...FOOD_MEALS];

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(v);
      }}
      className="flex flex-col gap-4"
    >
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-xs font-medium text-neutral-400 mb-1.5">Meal</legend>
        <div className="grid grid-cols-4 gap-1.5 p-1 bg-neutral-800 rounded-xl">
          {meals.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => set({ meal: m })}
              aria-pressed={v.meal === m}
              className={`rounded-lg py-2 text-sm truncate transition-colors ${
                v.meal === m ? "bg-orange-500 text-white font-semibold shadow" : "text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </fieldset>

      <label className={labelClass}>
        Food
        <input value={v.foodItem} onChange={(e) => set({ foodItem: e.target.value })} required maxLength={200} autoComplete="off" placeholder="e.g. Nasi goreng (1 plate)" className={fieldClass} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Calories
          <div className="relative">
            <input type="number" inputMode="decimal" min={0} step="any" required value={v.calories} onChange={(e) => set({ calories: e.target.value })} className={`${fieldClass} pr-12`} />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm pointer-events-none">kcal</span>
          </div>
        </label>
        <label className={labelClass}>
          Protein
          <div className="relative">
            <input type="number" inputMode="decimal" min={0} step="any" value={v.protein} onChange={(e) => set({ protein: e.target.value })} placeholder="—" className={`${fieldClass} pr-8`} />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm pointer-events-none">g</span>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Date
          <input type="date" required value={v.date} onChange={(e) => set({ date: e.target.value })} className={fieldClass} />
        </label>
        <label className={labelClass}>
          Note
          <input value={v.note} onChange={(e) => set({ note: e.target.value })} maxLength={500} autoComplete="off" placeholder="Optional" className={fieldClass} />
        </label>
      </div>

      {passcode && (
        <label className={labelClass}>
          Passcode
          <input type="password" value={passcode.value} onChange={(e) => passcode.onChange(e.target.value)} required autoComplete="current-password" className={fieldClass} />
        </label>
      )}

      {error && <p role="alert" className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3 pt-1">
        {secondary}
        <button type="submit" disabled={busy} className="flex-1 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl py-3.5 disabled:opacity-50 transition-colors">
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
