export const FOOD_MEALS = ["Breakfast", "Lunch", "Dinner", "Snack"] as const;
// Older options still present in the Notion select; accepted when editing, not offered for new entries
export const LEGACY_MEALS = ["Morning", "Morning Snack", "Afternoon Snack", "Evening Snack"] as const;
export type FoodMeal = (typeof FOOD_MEALS)[number] | (typeof LEGACY_MEALS)[number];
const ALL_MEALS: readonly string[] = [...FOOD_MEALS, ...LEGACY_MEALS];

export interface NewFoodEntry {
  date: string;
  meal: FoodMeal;
  foodItem: string;
  calories: number;
  protein: number | null;
  note: string;
}

type Result = { ok: true; entry: NewFoodEntry } | { ok: false; error: string };

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : NaN;
}

// Validates untrusted input (form fields, LLM tool arguments, client payloads).
export function parseFoodEntry(raw: Record<string, unknown>): Result {
  const foodItem = String(raw.foodItem ?? "").trim();
  const note = String(raw.note ?? "").trim();
  const date = String(raw.date ?? "").trim();
  const meal = String(raw.meal ?? "").trim();
  const calories = toNumber(raw.calories);
  const protein = toNumber(raw.protein);

  if (!foodItem) return { ok: false, error: "Enter what you ate." };
  if (foodItem.length > 200 || note.length > 500) return { ok: false, error: "Text is too long." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) return { ok: false, error: "Invalid date." };
  if (!ALL_MEALS.includes(meal)) return { ok: false, error: "Pick a meal." };
  if (calories === null || Number.isNaN(calories) || calories < 0 || calories > 20000) {
    return { ok: false, error: "Enter calories as a number." };
  }
  if (protein !== null && (Number.isNaN(protein) || protein < 0 || protein > 2000)) {
    return { ok: false, error: "Protein must be a number." };
  }
  return {
    ok: true,
    entry: {
      date,
      meal: meal as FoodMeal,
      foodItem,
      calories: Math.round(calories),
      protein: protein === null ? null : Math.round(protein * 10) / 10,
      note,
    },
  };
}

export function describeEntry(e: NewFoodEntry): string {
  return `${e.meal} · ${e.foodItem} — ${e.calories} kcal${e.protein !== null ? ` · ${e.protein}g protein` : ""}`;
}
