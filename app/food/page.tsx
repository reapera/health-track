import Link from "next/link";
import { fetchFoodLog, FoodEntry } from "@/lib/notion";
import { today, daysAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MEAL_ORDER = ["Breakfast", "Lunch", "Dinner", "Snack"];

function groupByMeal(entries: FoodEntry[]) {
  const map: Record<string, FoodEntry[]> = {};
  for (const e of entries) {
    const key = e.meal ?? "Other";
    map[key] = [...(map[key] ?? []), e];
  }
  return Object.entries(map).sort(([a], [b]) => {
    const ai = MEAL_ORDER.indexOf(a);
    const bi = MEAL_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function DayTotal({ entries }: { entries: FoodEntry[] }) {
  const cal = entries.reduce((s, e) => s + (e.calories ?? 0), 0);
  const pro = entries.reduce((s, e) => s + (e.protein ?? 0), 0);
  return (
    <span className="text-gray-500 text-xs">
      {cal > 0 ? `${cal} kcal` : "—"}
      {pro > 0 ? ` · ${pro}g protein` : ""}
    </span>
  );
}

function MealSection({ entries }: { entries: FoodEntry[] }) {
  const meals = groupByMeal(entries);
  const totalCal = entries.reduce((s, e) => s + (e.calories ?? 0), 0);
  const totalPro = entries.reduce((s, e) => s + (e.protein ?? 0), 0);

  return (
    <div className="flex flex-col gap-4">
      {meals.map(([meal, items]) => (
        <div key={meal}>
          <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">{meal}</p>
          <div className="flex flex-col gap-1">
            {items.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-white flex-1">{item.foodItem || "—"}</span>
                <span className="text-gray-500 text-xs">{item.calories != null ? `${item.calories} kcal` : ""}</span>
                <span className="text-gray-500 text-xs">{item.protein != null ? `${item.protein}g` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="border-t border-gray-800 pt-3 flex gap-4 text-sm font-semibold">
        <span>{totalCal > 0 ? `${totalCal} kcal` : "—"}</span>
        {totalPro > 0 && <span className="text-gray-400">{totalPro}g protein</span>}
      </div>
    </div>
  );
}

export default async function FoodPage() {
  const entries = await fetchFoodLog(daysAgo(59));
  const td = today();

  const todayEntries = entries.filter((e) => e.date === td);
  const historyEntries = entries.filter((e) => e.date !== td);

  // Group history by date descending
  const byDate: Record<string, FoodEntry[]> = {};
  for (const e of historyEntries) {
    byDate[e.date] = [...(byDate[e.date] ?? []), e];
  }
  const historyDays = Object.keys(byDate).sort().reverse();

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-white text-sm transition-colors">← Dashboard</Link>
          <h1 className="text-2xl font-bold">Food Log</h1>
        </div>

        <section className="flex flex-col gap-2">
          <p className="text-gray-400 text-xs uppercase tracking-widest">Today — {td}</p>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
            {todayEntries.length > 0
              ? <MealSection entries={todayEntries} />
              : <p className="text-gray-500 text-sm">No entries logged today</p>}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <p className="text-gray-400 text-xs uppercase tracking-widest">History ({historyDays.length} days)</p>
          {historyDays.length === 0 ? (
            <p className="text-gray-600 text-sm">No previous entries</p>
          ) : (
            <div className="flex flex-col gap-3">
              {historyDays.map((date) => (
                <div key={date} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-mono text-sm text-gray-300">{date}</p>
                    <DayTotal entries={byDate[date]} />
                  </div>
                  <MealSection entries={byDate[date]} />
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
