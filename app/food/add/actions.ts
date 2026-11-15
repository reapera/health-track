"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { createFoodEntry, FOOD_MEALS, type FoodMeal } from "@/lib/notion";

export interface AddFoodState {
  status: "idle" | "ok" | "error";
  message: string;
  // Echoed back on error so the form keeps what was typed
  values?: { food: string; calories: string; protein: string; note: string };
  // Entries added so far in this form session, newest first
  added: string[];
}

function passcodeMatches(given: string, expected: string): boolean {
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function addFood(prev: AddFoodState, formData: FormData): Promise<AddFoodState> {
  const str = (key: string) => String(formData.get(key) ?? "").trim();
  const values = { food: str("food"), calories: str("calories"), protein: str("protein"), note: str("note") };
  const fail = (message: string): AddFoodState => ({ status: "error", message, values, added: prev.added });

  // Server Actions are reachable by direct POST, so writes are gated by a passcode.
  const expected = process.env.LOG_PASSCODE;
  if (!expected) return fail("LOG_PASSCODE is not set on the server. Add it in Vercel and redeploy.");
  if (!passcodeMatches(str("passcode"), expected)) return fail("Wrong passcode.");

  const date = str("date");
  const meal = str("meal");
  const calories = Number(values.calories);
  const protein = values.protein === "" ? null : Number(values.protein);

  if (!values.food) return fail("Enter what you ate.");
  if (values.food.length > 200 || values.note.length > 500) return fail("Text is too long.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return fail("Invalid date.");
  if (!FOOD_MEALS.includes(meal as FoodMeal)) return fail("Pick a meal.");
  if (values.calories === "" || !Number.isFinite(calories) || calories < 0 || calories > 20000) {
    return fail("Enter calories as a number.");
  }
  if (protein !== null && (!Number.isFinite(protein) || protein < 0 || protein > 2000)) {
    return fail("Protein must be a number.");
  }

  try {
    await createFoodEntry({ date, meal: meal as FoodMeal, foodItem: values.food, calories, protein, note: values.note });
  } catch (err) {
    return fail(err instanceof Error ? err.message : "Failed to save to Notion.");
  }

  const line = `${meal} · ${values.food} — ${calories} kcal${protein !== null ? ` · ${protein}g protein` : ""}`;
  return { status: "ok", message: line, added: [line, ...prev.added].slice(0, 50) };
}
