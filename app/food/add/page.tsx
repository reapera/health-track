import { fetchFoodLog } from "@/lib/notion";
import { daysAgo } from "@/lib/utils";
import FoodChat, { type RecentFood } from "./FoodChat";

// Applies to the Server Actions called from this page (the Gemini request)
export const maxDuration = 60;

export const metadata = { title: "Log food — Health Dashboard" };

// Foods logged most often in the last 30 days, with their latest numbers, for one-tap re-logging
async function recentFoods(): Promise<RecentFood[]> {
  try {
    const entries = await fetchFoodLog(daysAgo(30));
    const byName = new Map<string, { food: RecentFood; count: number; last: string }>();
    for (const e of entries) {
      const name = (e.foodItem || e.name).trim();
      if (!name || e.calories == null) continue;
      const key = name.toLowerCase();
      const prev = byName.get(key);
      const food = { foodItem: name, meal: e.meal, calories: e.calories, protein: e.protein };
      if (!prev) byName.set(key, { food, count: 1, last: e.date });
      else byName.set(key, { food: e.date >= prev.last ? food : prev.food, count: prev.count + 1, last: e.date > prev.last ? e.date : prev.last });
    }
    return [...byName.values()]
      .sort((a, b) => b.count - a.count || b.last.localeCompare(a.last))
      .slice(0, 8)
      .map((x) => x.food);
  } catch {
    return [];
  }
}

export default async function AddFoodPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string | string[]; manual?: string | string[] }>;
}) {
  const params = await searchParams;
  const date = typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : undefined;
  const recent = await recentFoods();
  return <FoodChat initialDate={date} recent={recent} openManual={params.manual === "1"} />;
}
