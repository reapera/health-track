import DeltaBadge from "./DeltaBadge";

interface Props {
  label: string;
  value: string | null;
  unit?: string;
  delta?: string | null;
  deltaUnit?: string;
  inverse?: boolean;
  icon: string;
  staleDate?: string | null;
  deltaLabel?: string;
  // Tailwind background class for the section color bar, e.g. "bg-amber-400"
  accent?: string;
}

export default function StatCard({ label, value, unit, delta, deltaUnit, inverse, icon, staleDate, deltaLabel, accent }: Props) {
  const stale = !!staleDate;
  return (
    <div className={`relative overflow-hidden bg-gray-900 rounded-2xl p-5 flex flex-col gap-2 border ${stale ? "border-yellow-500/30" : "border-gray-800"}`}>
      {accent && <div aria-hidden className={`absolute inset-x-0 top-0 h-1 ${accent}`} />}
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <span className="text-xl">{icon}</span>
        {label}
        {stale && (
          <span className="ml-auto text-xs font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded px-1.5 py-0.5">
            {staleDate}
          </span>
        )}
      </div>
      <div className={`text-3xl font-bold ${stale ? "text-yellow-300" : "text-white"}`}>
        {value ?? <span className="text-gray-600 text-xl">—</span>}
        {value && unit && <span className={`text-lg ml-1 ${stale ? "text-yellow-500/70" : "text-gray-400"}`}>{unit}</span>}
      </div>
      <DeltaBadge value={delta ?? null} unit={deltaUnit} inverse={inverse} vsLabel={deltaLabel} />
    </div>
  );
}
