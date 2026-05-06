import { FoodEntry, StepsEntry, WeightEntry, WorkoutEntry } from "./notion";

export function toDateStr(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
}

export function today(): string {
  return toDateStr(new Date());
}

// Returns a delta string like "+1.2" or "-0.3"
export function delta(current: number | null, previous: number | null): string | null {
  if (current === null || previous === null) return null;
  const diff = current - previous;
  return (diff >= 0 ? "+" : "") + diff.toFixed(1);
}

export function deltaPercent(current: number | null, previous: number | null): string | null {
  if (current === null || previous === null || previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  return (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%";
}

// Aggregate daily calories from food entries
export function dailyCalories(entries: FoodEntry[]): Record<string, number> {
  return entries.reduce<Record<string, number>>((acc, e) => {
    if (e.calories) acc[e.date] = (acc[e.date] ?? 0) + e.calories;
    return acc;
  }, {});
}

export function dailyProtein(entries: FoodEntry[]): Record<string, number> {
  return entries.reduce<Record<string, number>>((acc, e) => {
    if (e.protein) acc[e.date] = (acc[e.date] ?? 0) + e.protein;
    return acc;
  }, {});
}

// Build a 7-day chart array with labels
export function buildWeekSeries(
  data: Record<string, number>,
  startDate: string
): { date: string; value: number }[] {
  const result = [];
  const base = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const key = toDateStr(d);
    result.push({ date: key, value: data[key] ?? 0 });
  }
  return result;
}

export function average(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export interface DashboardData {
  today: string;
  todayWeight: WeightEntry | null;
  todayCalories: number | null;
  todayProtein: number | null;
  todaySteps: StepsEntry | null;
  todayWorkouts: WorkoutEntry[];
  weightSeries: { date: string; weight: number | null; bodyFat: string }[];
  calorieSeries: { date: string; calories: number; protein: number }[];
  stepsSeries: { date: string; steps: number }[];
  weekWorkouts: WorkoutEntry[];
  deltas: {
    weight: string | null;
    calories: string | null;
    steps: string | null;
  };
}

export function buildDashboard(
  weights: WeightEntry[],
  foods: FoodEntry[],
  workouts: WorkoutEntry[],
  steps: StepsEntry[]
): DashboardData {
  const td = today();
  const thisWeekStart = daysAgo(6);

  // Today's entries
  const todayWeight = weights.filter((w) => w.date === td).at(-1) ?? null;
  const todayFoods = foods.filter((f) => f.date === td);
  const todayCalories = todayFoods.reduce((s, f) => s + (f.calories ?? 0), 0) || null;
  const todayProtein = todayFoods.reduce((s, f) => s + (f.protein ?? 0), 0) || null;
  const todaySteps = steps.filter((s) => s.date === td).at(-1) ?? null;
  const todayWorkouts = workouts.filter((w) => w.date === td);

  // This week (last 7 days including today)
  const thisWeekFoods = foods.filter((f) => f.date >= thisWeekStart && f.date <= td);
  const thisWeekSteps = steps.filter((s) => s.date >= thisWeekStart && s.date <= td);
  const weekWorkouts = workouts.filter((w) => w.date >= thisWeekStart && w.date <= td);

  // Previous entries (most recent before today)
  const prevWeight = weights.filter((w) => w.date < td).at(-1) ?? null;
  const yesterday = daysAgo(1);
  const yesterdayFoods = foods.filter((f) => f.date === yesterday);
  const yesterdayCalories = yesterdayFoods.reduce((s, f) => s + (f.calories ?? 0), 0) || null;
  const yesterdaySteps = steps.filter((s) => s.date === yesterday).at(-1)?.steps ?? null;

  // Weight series (14 days)
  const weightSeries = weights.map((w) => ({
    date: w.date,
    weight: w.weight,
    bodyFat: w.bodyFat,
  }));

  // Calorie series (this week)
  const calMap = dailyCalories(thisWeekFoods);
  const protMap = dailyProtein(thisWeekFoods);
  const calorieSeries = buildWeekSeries(calMap, thisWeekStart).map((d) => ({
    date: d.date,
    calories: d.value,
    protein: protMap[d.date] ?? 0,
  }));

  // Steps series (this week)
  const stepsMap = thisWeekSteps.reduce<Record<string, number>>((acc, s) => {
    if (s.steps) acc[s.date] = s.steps;
    return acc;
  }, {});
  const stepsSeries = buildWeekSeries(stepsMap, thisWeekStart).map((d) => ({
    date: d.date,
    steps: d.value,
  }));

  return {
    today: td,
    todayWeight,
    todayCalories,
    todayProtein,
    todaySteps,
    todayWorkouts,
    weightSeries,
    calorieSeries,
    stepsSeries,
    weekWorkouts,
    deltas: {
      weight: delta(todayWeight?.weight ?? null, prevWeight?.weight ?? null),
      calories: delta(todayCalories, yesterdayCalories),
      steps: delta(todaySteps?.steps ?? null, yesterdaySteps),
    },
  };
}
