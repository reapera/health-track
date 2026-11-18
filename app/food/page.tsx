import Link from "next/link";
import { fetchFoodLog, FoodEntry } from "@/lib/notion";
import { today, daysAgo } from "@/lib/utils";
import FoodItem from "./FoodItem";

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

function AddLink({ date }: { date: string }) {
  return (
    <Link
      href={`/food/add?date=${date}`}
      className="text-amber-300/80 hover:text-amber-200 text-xs border border-amber-500/30 hover:border-amber-400 rounded-lg px-2 py-1 transition-colors"
    >
      + Add
    </Link>
  );
}

function DayTotal({ entries }: { entries: FoodEntry[] }) {
  const cal = entries.reduce((s, e) => s + (e.calories ?? 0), 0);
  const pro = entries.reduce((s, e) => s + (e.protein ?? 0), 0);
  return (
    <span className="text-stone-500 text-xs">
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
          <p className="text-amber-200/60 text-xs uppercase tracking-wide mb-2">{meal}</p>
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <FoodItem key={item.id} entry={item} />
            ))}
          </div>
        </div>
      ))}
      <div className="border-t border-amber-950/80 pt-3 flex gap-4 text-sm font-semibold">
        <span className="text-amber-300">{totalCal > 0 ? `${totalCal} kcal` : "—"}</span>
        {totalPro > 0 && <span className="text-stone-400">{totalPro}g protein</span>}
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
    <main className="min-h-screen bg-[#130d08] bg-[radial-gradient(ellipse_80%_45%_at_50%_0%,rgba(245,158,11,0.16),transparent)] border-t-4 border-amber-400 text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        <div className="flex items-center gap-4">
          <Link href="/" aria-label="Dashboard" className="shrink-0 text-stone-500 hover:text-white text-sm transition-colors">←<span className="hidden sm:inline"> Dashboard</span></Link>
          <h1 className="text-2xl font-bold whitespace-nowrap"><span aria-hidden className="mr-2">🔥</span>Food Log</h1>
          <Link href="/food/add" className="ml-auto shrink-0 whitespace-nowrap bg-amber-400 text-stone-950 text-sm font-semibold rounded-xl px-4 py-2 hover:opacity-80 transition-opacity">+ Add food</Link>
        </div>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-stone-400 text-xs uppercase tracking-widest">Today — {td}</p>
            <AddLink date={td} />
          </div>
          <div className="bg-[#1f160e]/90 border border-amber-500/30 rounded-2xl p-5">
            {todayEntries.length > 0
              ? <MealSection entries={todayEntries} />
              : <p className="text-stone-500 text-sm">No entries logged today</p>}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-stone-400 text-xs uppercase tracking-widest">History ({historyDays.length} days)</p>
            <form action="/food/add" className="flex items-center gap-2">
              <input type="date" name="date" required max={td} aria-label="Date to add food for" className="bg-[#1f160e]/90 border border-amber-950/80 rounded-lg px-2 py-1 text-sm text-stone-300" />
              <button className="text-amber-300/80 hover:text-amber-200 text-xs border border-amber-500/30 hover:border-amber-400 rounded-lg px-2 py-1 transition-colors">+ Add</button>
            </form>
          </div>
          {historyDays.length === 0 ? (
            <p className="text-stone-600 text-sm">No previous entries</p>
          ) : (
            <div className="flex flex-col gap-3">
              {historyDays.map((date) => (
                <div key={date} className="bg-[#1f160e]/90 border border-amber-950/80 rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <p className="font-mono text-sm text-stone-300 flex-1">{date}</p>
                    <DayTotal entries={byDate[date]} />
                    <AddLink date={date} />
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
