import Link from "next/link";
import { fetchLabLog, LabEntry } from "@/lib/notion";

export const dynamic = "force-dynamic";

const FLAG_STYLES: Record<string, { text: string; badge: string; dot: string }> = {
  Normal:     { text: "text-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
  Borderline: { text: "text-amber-400",   badge: "bg-amber-500/10 text-amber-400 border-amber-500/30",       dot: "bg-amber-400" },
  High:       { text: "text-red-400",     badge: "bg-red-500/10 text-red-400 border-red-500/30",             dot: "bg-red-400" },
  Low:        { text: "text-sky-400",     badge: "bg-sky-500/10 text-sky-400 border-sky-500/30",             dot: "bg-sky-400" },
};

const NEUTRAL = { text: "text-gray-300", badge: "bg-gray-800 text-gray-400 border-gray-700", dot: "bg-gray-600" };

export function flagStyle(flag: string | null) {
  return (flag && FLAG_STYLES[flag]) || NEUTRAL;
}

function TestRow({ entry }: { entry: LabEntry }) {
  const s = flagStyle(entry.flag);
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-800 last:border-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-white text-sm">{entry.test || "—"}</span>
        {entry.referenceRange && (
          <span className="text-gray-600 text-xs">Ref: {entry.referenceRange} {entry.unit}</span>
        )}
        {entry.note && <span className="text-gray-600 text-xs italic">{entry.note}</span>}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span className={`font-semibold ${s.text}`}>
          {entry.value != null ? entry.value : "—"}
          {entry.unit && <span className="text-xs font-normal text-gray-500 ml-1">{entry.unit}</span>}
        </span>
        {entry.flag && (
          <span className={`text-xs px-2 py-0.5 rounded-full border ${s.badge}`}>{entry.flag}</span>
        )}
      </div>
    </div>
  );
}

export default async function LabPage() {
  const entries = await fetchLabLog("2000-01-01");

  const byDate: Record<string, LabEntry[]> = {};
  for (const e of entries) {
    byDate[e.date] = [...(byDate[e.date] ?? []), e];
  }
  const dates = Object.keys(byDate).sort().reverse();

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-white text-sm transition-colors">← Dashboard</Link>
          <h1 className="text-2xl font-bold">Lab Results</h1>
        </div>

        {dates.length === 0 ? (
          <p className="text-gray-600 text-sm">No lab results logged yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {dates.map((date) => {
              const tests = byDate[date];
              const abnormal = tests.filter((t) => t.flag && t.flag !== "Normal").length;
              return (
                <section key={date} className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-mono text-sm text-gray-300">{date}</p>
                    <p className="text-xs text-gray-500">
                      {tests.length} test{tests.length !== 1 ? "s" : ""}
                      {abnormal > 0 && <span className="text-amber-400"> · {abnormal} flagged</span>}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    {tests.map((t, i) => <TestRow key={i} entry={t} />)}
                  </div>
                </section>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
