import Link from "next/link";
import { fetchWorkoutLog, WorkoutEntry } from "@/lib/notion";
import { today, daysAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

function WorkoutDay({ date, entries, highlight }: { date: string; entries: WorkoutEntry[]; highlight?: boolean }) {
  return (
    <div className={`bg-gray-900 rounded-2xl p-5 border ${highlight ? "border-indigo-400/60" : "border-gray-800"}`}>
      <p className="font-mono text-sm text-indigo-200/70 mb-4">{date}</p>
      <div className="flex flex-col gap-3">
        {entries.map((w, i) => (
          <div key={i} className="flex items-start gap-3">
            <span className="text-xs font-medium text-indigo-400 bg-indigo-900/30 rounded px-2 py-1 min-w-fit">{w.level || "—"}</span>
            <div className="flex flex-col gap-0.5 flex-1">
              <span className="text-white text-sm font-medium">{w.exercise || "—"}</span>
              {w.notes && <span className="text-gray-500 text-xs">{w.notes}</span>}
            </div>
            {w.reps != null && (
              <span className="text-gray-300 text-sm font-mono">×{w.reps}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function WorkoutPage() {
  const entries = await fetchWorkoutLog(daysAgo(59));
  const td = today();

  const todayEntries = entries.filter((e) => e.date === td);

  // Group history by date
  const byDate: Record<string, WorkoutEntry[]> = {};
  for (const e of entries.filter((e) => e.date !== td)) {
    byDate[e.date] = [...(byDate[e.date] ?? []), e];
  }
  const historyDays = Object.keys(byDate).sort().reverse().slice(0, 20);

  return (
    <main className="min-h-screen bg-gray-950 border-t-4 border-indigo-400 text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-white text-sm transition-colors">← Dashboard</Link>
          <h1 className="text-2xl font-bold"><span aria-hidden className="mr-2">💪</span>Workouts</h1>
        </div>

        <section className="flex flex-col gap-2">
          <p className="text-gray-400 text-xs uppercase tracking-widest">Today — {td}</p>
          {todayEntries.length > 0
            ? <WorkoutDay date={td} entries={todayEntries} highlight />
            : <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-gray-500 text-sm">Rest day — no workouts logged</div>}
        </section>

        <section className="flex flex-col gap-3">
          <p className="text-gray-400 text-xs uppercase tracking-widest">History (last {historyDays.length} days)</p>
          {historyDays.length === 0 ? (
            <p className="text-gray-600 text-sm">No previous entries</p>
          ) : (
            <div className="flex flex-col gap-3">
              {historyDays.map((date) => (
                <WorkoutDay key={date} date={date} entries={byDate[date]} />
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
