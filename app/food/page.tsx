import Link from "next/link";
import { calorieTarget } from "@/lib/food";
import { dayLabel, fmt } from "@/lib/dates";
import { fetchFoodLog, type FoodEntry } from "@/lib/notion";
import { daysAgo, today } from "@/lib/utils";
import EntryRow, { SwipeHint } from "./EntryRow";

export const dynamic = "force-dynamic";

// Server Actions on this page wait for Notion's query to reflect each write
export const maxDuration = 30;

const MEAL_ORDER = ["Breakfast", "Morning", "Morning Snack", "Lunch", "Afternoon Snack", "Dinner", "Snack", "Evening Snack"];

function sum(entries: FoodEntry[], key: "calories" | "protein") {
  return entries.reduce((s, e) => s + (e[key] ?? 0), 0);
}

function groupByMeal(entries: FoodEntry[]) {
  const map = new Map<string, FoodEntry[]>();
  for (const e of entries) {
    const key = e.meal ?? "Other";
    map.set(key, [...(map.get(key) ?? []), e]);
  }
  const rank = (m: string) => (MEAL_ORDER.includes(m) ? MEAL_ORDER.indexOf(m) : 99);
  return [...map.entries()].sort(([a], [b]) => rank(a) - rank(b));
}

function Progress({ value, target, tone }: { value: number; target: number; tone: "hero" | "row" }) {
  const pct = Math.min(100, (value / target) * 100);
  const over = value > target;
  const track = tone === "hero" ? "bg-white/25" : "bg-neutral-800";
  const bar = tone === "hero" ? (over ? "bg-yellow-200" : "bg-white") : over ? "bg-red-400" : "bg-orange-400";
  return (
    <div className={`h-1.5 rounded-full overflow-hidden ${track}`} role="progressbar" aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.round(value)} aria-label="Calories versus daily target">
      <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Meals({ entries }: { entries: FoodEntry[] }) {
  return (
    <div className="flex flex-col gap-4">
      {groupByMeal(entries).map(([meal, items]) => (
        <section key={meal} aria-label={meal}>
          <div className="flex items-baseline justify-between text-xs uppercase tracking-wider text-neutral-500 font-medium">
            <h3>{meal}</h3>
            <span className="tabular-nums">{fmt(sum(items, "calories"))} kcal</span>
          </div>
          <ul className="divide-y divide-neutral-800/80">
            {items.map((e) => (
              <EntryRow key={e.id} entry={e} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default async function FoodPage() {
  const td = today();
  const target = calorieTarget();
  const entries = await fetchFoodLog(daysAgo(59));

  const byDate = new Map<string, FoodEntry[]>();
  for (const e of entries) byDate.set(e.date, [...(byDate.get(e.date) ?? []), e]);
  const todayEntries = byDate.get(td) ?? [];
  const pastDays = [...byDate.keys()].filter((d) => d < td).sort().reverse();

  const todayCal = sum(todayEntries, "calories");
  const todayPro = sum(todayEntries, "protein");

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-4 pt-6 pb-32 md:px-10 md:pt-10">
      <div className="max-w-xl mx-auto flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <Link href="/" aria-label="Dashboard" className="h-10 w-10 -ml-2 grid place-items-center rounded-full text-neutral-400 hover:text-white hover:bg-neutral-900">
            ←
          </Link>
          <h1 className="text-xl font-semibold">Food</h1>
        </header>

        {/* Today */}
        <section className="rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-rose-500 p-5 shadow-lg shadow-orange-950/40">
          <p className="text-sm font-medium text-white/80">
            Today · {new Date(`${td}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short", timeZone: "UTC" })}
          </p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-5xl font-bold tracking-tight tabular-nums">{fmt(todayCal)}</span>
            <span className="pb-1.5 text-white/80">{target ? `/ ${fmt(target)} kcal` : "kcal"}</span>
          </div>
          {target && (
            <div className="mt-4 flex flex-col gap-1.5">
              <Progress value={todayCal} target={target} tone="hero" />
              <p className="text-sm text-white/85">
                {todayCal <= target ? `${fmt(target - todayCal)} kcal left` : `${fmt(todayCal - target)} kcal over`}
              </p>
            </div>
          )}
          <div className="mt-4 flex gap-6 text-sm">
            <div>
              <p className="text-white/70">Protein</p>
              <p className="font-semibold tabular-nums">{fmt(todayPro)} g</p>
            </div>
            <div>
              <p className="text-white/70">Items</p>
              <p className="font-semibold tabular-nums">{todayEntries.length}</p>
            </div>
          </div>
        </section>

        {todayEntries.length > 0 ? (
          <div className="rounded-3xl bg-neutral-900 border border-neutral-800 px-5 py-4 overflow-hidden">
            <SwipeHint />
            <Meals entries={todayEntries} />
          </div>
        ) : (
          <p className="text-center text-neutral-500 text-sm py-2">Nothing logged yet today.</p>
        )}

        {/* History */}
        {pastDays.length > 0 && (
          <section className="flex flex-col gap-2" aria-labelledby="history-heading">
            <h2 id="history-heading" className="px-1 text-sm font-medium text-neutral-400">Earlier</h2>
            <div className="rounded-3xl bg-neutral-900 border border-neutral-800 divide-y divide-neutral-800 overflow-hidden">
              {pastDays.map((date) => {
                const items = byDate.get(date)!;
                const cal = sum(items, "calories");
                const pro = sum(items, "protein");
                return (
                  <details key={date} className="group">
                    <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:bg-neutral-800/40">
                      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-medium">{dayLabel(date, td)}</span>
                          <span className="tabular-nums text-neutral-200">
                            {fmt(cal)} <span className="text-neutral-500 text-xs">kcal</span>
                          </span>
                        </div>
                        {target && <Progress value={cal} target={target} tone="row" />}
                        <span className="text-xs text-neutral-500">
                          {items.length} {items.length === 1 ? "item" : "items"} · {fmt(pro)} g protein
                        </span>
                      </div>
                      <svg viewBox="0 0 20 20" className="h-4 w-4 text-neutral-500 transition-transform group-open:rotate-180" fill="currentColor" aria-hidden>
                        <path d="M5.2 7.5a1 1 0 0 1 1.4 0L10 10.9l3.4-3.4a1 1 0 1 1 1.4 1.4l-4.1 4.1a1 1 0 0 1-1.4 0L5.2 8.9a1 1 0 0 1 0-1.4z" />
                      </svg>
                    </summary>
                    <div className="px-5 pb-4">
                      <Meals entries={items} />
                    </div>
                  </details>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {/* One clear way to add food; the date is chosen on the next screen */}
      <div className="fixed inset-x-0 bottom-0 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-6 bg-gradient-to-t from-neutral-950 via-neutral-950/90 to-transparent pointer-events-none">
        <div className="max-w-xl mx-auto px-4 flex justify-center">
          <Link
            href="/food/add"
            className="pointer-events-auto flex items-center gap-2 rounded-full bg-orange-500 hover:bg-orange-400 px-7 py-4 font-semibold shadow-lg shadow-orange-950/50 transition-colors"
          >
            <span aria-hidden className="text-xl leading-none">＋</span> Log food
          </Link>
        </div>
      </div>
    </main>
  );
}
