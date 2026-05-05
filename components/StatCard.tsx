import DeltaBadge from "./DeltaBadge";

interface Props {
  label: string;
  value: string | null;
  unit?: string;
  delta?: string | null;
  deltaUnit?: string;
  inverse?: boolean;
  icon: string;
}

export default function StatCard({ label, value, unit, delta, deltaUnit, inverse, icon }: Props) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <span className="text-xl">{icon}</span>
        {label}
      </div>
      <div className="text-3xl font-bold text-white">
        {value ?? <span className="text-gray-600 text-xl">—</span>}
        {value && unit && <span className="text-gray-400 text-lg ml-1">{unit}</span>}
      </div>
      <DeltaBadge value={delta ?? null} unit={deltaUnit} inverse={inverse} />
    </div>
  );
}
