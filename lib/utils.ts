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
  latestWeight: { weight: number | null; date: string } | null;
  latestCalories: { calories: number; date: string } | null;
  latestSteps: { steps: number; date: string } | null;
  latestWorkouts: { workouts: WorkoutEntry[]; date: string } | null;
  weightSeries: { date: string; weight: number | null; bodyFat: string }[];
  calorieSeries: { date: string; calories: number; protein: number }[];
  stepsSeries: { date: string; steps: number }[];
  weekWorkouts: WorkoutEntry[];
  deltas: {
    weight: string | null;
    weightLabel: string | null;
    calories: string | null;
    caloriesLabel: string | null;
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

  // Latest entries before today (shown when today has no data)
  const latestWeightEntry = !todayWeight ? weights.filter((w) => w.date < td && w.weight !== null).at(-1) : null;
  const latestWeight = latestWeightEntry ? { weight: latestWeightEntry.weight, date: latestWeightEntry.date } : null;

  const calByDay = dailyCalories(foods.filter((f) => f.date < td));
  const latestCalDay = !todayCalories ? Object.keys(calByDay).sort().at(-1) : null;
  const latestCalories = latestCalDay ? { calories: calByDay[latestCalDay], date: latestCalDay } : null;

  const latestStepsEntry = !todaySteps ? steps.filter((s) => s.date < td && s.steps !== null).at(-1) : null;
  const latestSteps = latestStepsEntry ? { steps: latestStepsEntry.steps!, date: latestStepsEntry.date } : null;

  const latestWorkoutDay = !todayWorkouts.length ? workouts.filter((w) => w.date < td).at(-1)?.date : null;
  const latestWorkouts = latestWorkoutDay
    ? { workouts: workouts.filter((w) => w.date === latestWorkoutDay), date: latestWorkoutDay }
    : null;

  // Weight delta: try h-7 then h-6 … h-1 until a logged entry is found
  function dateOffset(base: string, n: number): string {
    const d = new Date(base);
    d.setDate(d.getDate() - n);
    return toDateStr(d);
  }
  let prevWeight: WeightEntry | null = null;
  let weightLabel: string | null = null;
  for (let n = 7; n >= 1; n--) {
    const target = dateOffset(td, n);
    const entry = weights.filter((w) => w.date === target && w.weight !== null).at(-1) ?? null;
    if (entry) {
      prevWeight = entry;
      weightLabel = n === 7 ? "vs last week" : `vs h-${n}`;
      break;
    }
  }

  // Calories delta: average of h-7 to h-1 days that have data
  const last7Start = dateOffset(td, 7);
  const last7CalMap = dailyCalories(foods.filter((f) => f.date >= last7Start && f.date < td));
  const last7CalValues = Object.values(last7CalMap);
  const avgLast7Cal = last7CalValues.length ? average(last7CalValues) : null;
  const caloriesLabel = last7CalValues.length ? `vs ${last7CalValues.length}d avg` : null;

  // Steps: most recent previous entry
  const prevStepsEntry = steps.filter((s) => s.date < td && s.steps !== null).at(-1) ?? null;

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
    latestWeight,
    latestCalories,
    latestSteps,
    latestWorkouts,
    weightSeries,
    calorieSeries,
    stepsSeries,
    weekWorkouts,
    deltas: {
      weight: delta(todayWeight?.weight ?? null, prevWeight?.weight ?? null),
      weightLabel,
      calories: delta(todayCalories, avgLast7Cal),
      caloriesLabel,
      steps: delta(todaySteps?.steps ?? null, prevStepsEntry?.steps ?? null),
    },
  };
}
