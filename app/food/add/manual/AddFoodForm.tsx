"use client";

import { rememberPasscode as storePasscode, savedPasscode } from "@/lib/passcode-client";
import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { addFood, type AddFoodState } from "../actions";

const MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;

const initialState: AddFoodState = { status: "idle", message: "", added: [] };

function localDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function mealForNow(): (typeof MEALS)[number] {
  const h = new Date().getHours();
  if (h < 10) return "Breakfast";
  if (h >= 11 && h < 15) return "Lunch";
  if (h >= 18 && h < 21) return "Dinner";
  return "Snack";
}

const inputClass =
  "w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-base text-white placeholder-stone-500 focus:outline-none focus:border-amber-400";
const labelClass = "text-stone-400 text-xs uppercase tracking-wide";

const noopSubscribe = () => () => {};

// Defaults (date, meal, saved passcode) come from the device, so the form renders on the client only.
export default function AddFoodForm({ initialDate }: { initialDate?: string }) {
  const isClient = useSyncExternalStore(noopSubscribe, () => true, () => false);
  return isClient ? <Form initialDate={initialDate} /> : null;
}

function Form({ initialDate }: { initialDate?: string }) {
  const [state, formAction, pending] = useActionState(addFood, initialState);
  const [date, setDate] = useState(() => initialDate ?? localDate());
  const [meal, setMeal] = useState<string>(mealForNow);
  const [passcode, setPasscode] = useState(savedPasscode);
  const added = state.added;

  // Remember the passcode on this device once the server has accepted it
  useEffect(() => {
    if (added.length === 0) return;
    storePasscode(passcode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [added.length]);

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="bg-[#1f160e]/90 border border-amber-950/80 rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className={labelClass}>Meal</span>
          <input type="hidden" name="meal" value={meal} />
          <div className="grid grid-cols-4 gap-2">
            {MEALS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMeal(m)}
                aria-pressed={meal === m}
                className={`rounded-xl py-2.5 text-xs sm:text-sm transition-colors ${
                  meal === m ? "bg-amber-400 text-stone-950 font-semibold" : "bg-stone-800 text-stone-300 hover:bg-stone-700"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>Food</span>
          <input
            name="food"
            type="text"
            required
            maxLength={200}
            autoComplete="off"
            placeholder="e.g. Nasi goreng"
            defaultValue={state.values?.food ?? ""}
            className={inputClass}
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-2">
            <span className={labelClass}>Calories (kcal)</span>
            <input
              name="calories"
              type="number"
              inputMode="decimal"
              required
              min={0}
              step="any"
              placeholder="450"
              defaultValue={state.values?.calories ?? ""}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className={labelClass}>Protein (g)</span>
            <input
              name="protein"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              placeholder="optional"
              defaultValue={state.values?.protein ?? ""}
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>Date</span>
          <input
            name="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>Note</span>
          <input
            name="note"
            type="text"
            maxLength={500}
            autoComplete="off"
            placeholder="optional"
            defaultValue={state.values?.note ?? ""}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className={labelClass}>Passcode</span>
          <input
            name="passcode"
            type="password"
            required
            autoComplete="current-password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            className={inputClass}
          />
        </label>

        {state.status === "error" && (
          <p role="alert" className="text-red-400 text-sm">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-amber-400 text-stone-950 font-semibold rounded-xl py-3 disabled:opacity-50 transition-opacity"
        >
          {pending ? "Saving…" : "Add to Notion"}
        </button>
      </form>

      {added.length > 0 && (
        <section className="flex flex-col gap-2" aria-live="polite">
          <p className="text-stone-400 text-xs uppercase tracking-widest">Added this session</p>
          <ul className="bg-[#1f160e]/90 border border-amber-950/80 rounded-2xl p-5 flex flex-col gap-2 text-sm">
            {added.map((line, i) => (
              <li key={added.length - i} className="flex gap-2">
                <span className="text-green-400">✓</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
