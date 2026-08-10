import Link from "next/link";
import type { LabEntry } from "@/lib/notion";

interface Props {
  latest: LabEntry | null;
}

function dot(value: number | null, high: number, warn: number) {
  if (value === null) return "bg-gray-700";
  if (value <= high) return "bg-emerald-400";
  if (value <= warn) return "bg-amber-400";
  return "bg-red-400";
}

function val(value: number | null, unit: string) {
  return value != null ? `${value} ${unit}` : "—";
}

export default function LabCard({ latest }: Props) {
  return (
    <Link href="/lab" className="block">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-lg">🩸</span>
            <h3 className="text-white font-semibold">Lab Results</h3>
          </div>
          {latest && <p className="text-gray-600 text-xs font-mono">{latest.date}</p>}
        </div>

        {!latest ? (
          <p className="text-gray-600 text-sm">No results logged yet</p>
        ) : (
          <div className="flex flex-col gap-3">
            {[
              { label: "Blood Sugar", value: latest.bloodSugar, unit: "mg/dL", high: 99,  warn: 126 },
              { label: "Cholesterol", value: latest.cholesterol, unit: "mg/dL", high: 199, warn: 239 },
              { label: "Uric Acid",   value: latest.uricAcid,   unit: "mg/dL", high: 7.2, warn: 9.0 },
            ].map(({ label, value, unit, high, warn }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${dot(value, high, warn)}`} />
                  <span className="text-gray-400 text-sm">{label}</span>
                </div>
                <span className="text-white text-sm font-medium">{val(value, unit)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
