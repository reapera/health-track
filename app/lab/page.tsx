import Link from "next/link";
import { fetchLabLog } from "@/lib/notion";

export const dynamic = "force-dynamic";

// Reference ranges
const RANGES = {
  bloodSugar:  { low: 70,  high: 99,  unit: "mg/dL", label: "Blood Sugar",  warn: 126 },
  cholesterol: { low: 0,   high: 199, unit: "mg/dL", label: "Cholesterol",  warn: 239 },
  uricAcid:    { low: 3.5, high: 7.2, unit: "mg/dL", label: "Uric Acid",    warn: 9.0 },
};

function status(value: number | null, range: typeof RANGES.bloodSugar) {
  if (value === null) return "empty";
  if (value <= range.high) return "normal";
  if (value <= range.warn) return "borderline";
  return "high";
}

const STATUS_COLORS: Record<string, string> = {
  normal:     "text-emerald-400",
  borderline: "text-amber-400",
  high:       "text-red-400",
  empty:      "text-gray-600",
};

function Metric({ label, value, unit, s }: { label: string; value: number | null; unit: string; s: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`font-semibold text-lg ${STATUS_COLORS[s]}`}>
        {value != null ? `${value}` : "—"}
        {value != null && <span className="text-xs font-normal ml-1 text-gray-500">{unit}</span>}
      </span>
    </div>
  );
}

export default async function LabPage() {
  const entries = await fetchLabLog("2020-01-01");
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-white text-sm transition-colors">← Dashboard</Link>
          <h1 className="text-2xl font-bold">Lab Results</h1>
        </div>

        {/* Reference ranges legend */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-3">
          <p className="text-gray-400 text-xs uppercase tracking-widest">Reference Ranges</p>
          <div className="grid grid-cols-3 gap-4 text-xs">
            {Object.values(RANGES).map((r) => (
              <div key={r.label}>
                <p className="text-gray-300 font-medium mb-1">{r.label}</p>
                <p className="text-emerald-400">Normal: ≤{r.high} {r.unit}</p>
                <p className="text-amber-400">Borderline: ≤{r.warn}</p>
                <p className="text-red-400">High: &gt;{r.warn}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Entries */}
        {sorted.length === 0 ? (
          <p className="text-gray-600 text-sm">No lab results logged yet.</p>
        ) : (
          <div className="flex flex-col gap-4">
            {sorted.map((e, i) => {
              const bs = status(e.bloodSugar, RANGES.bloodSugar);
              const ch = status(e.cholesterol, RANGES.cholesterol);
              const ua = status(e.uricAcid, RANGES.uricAcid);
              return (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm text-gray-300">{e.date}</p>
                    {e.name && <p className="text-gray-500 text-xs">{e.name}</p>}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Metric label="Blood Sugar" value={e.bloodSugar} unit="mg/dL" s={bs} />
                    <Metric label="Cholesterol" value={e.cholesterol} unit="mg/dL" s={ch} />
                    <Metric label="Uric Acid" value={e.uricAcid} unit="mg/dL" s={ua} />
                  </div>
                  {e.notes && <p className="text-gray-500 text-xs">{e.notes}</p>}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </main>
  );
}
