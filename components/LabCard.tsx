import Link from "next/link";
import type { LabEntry } from "@/lib/notion";

const DOTS: Record<string, string> = {
  Normal:     "bg-emerald-400",
  Borderline: "bg-amber-400",
  High:       "bg-red-400",
  Low:        "bg-sky-400",
};

const TEXT: Record<string, string> = {
  Normal:     "text-emerald-400",
  Borderline: "text-amber-400",
  High:       "text-red-400",
  Low:        "text-sky-400",
};

export default function LabCard({ entries }: { entries: LabEntry[] }) {
  const date = entries[0]?.date ?? null;
  const flagged = entries.filter((e) => e.flag && e.flag !== "Normal").length;

  return (
    <Link href="/lab" className="block">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🩸</span>
            <h3 className="text-white font-semibold">Lab Results</h3>
            {flagged > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                {flagged} flagged
              </span>
            )}
          </div>
          {date && <p className="text-gray-600 text-xs font-mono">{date}</p>}
        </div>

        {entries.length === 0 ? (
          <p className="text-gray-600 text-sm">No results logged yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            {entries.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${e.flag ? DOTS[e.flag] ?? "bg-gray-600" : "bg-gray-600"}`} />
                  <span className="text-gray-400 text-sm truncate">{e.test}</span>
                </div>
                <span className={`text-sm font-medium shrink-0 ${e.flag ? TEXT[e.flag] ?? "text-white" : "text-white"}`}>
                  {e.value != null ? e.value : "—"}
                  {e.unit && <span className="text-xs text-gray-600 ml-1">{e.unit}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
