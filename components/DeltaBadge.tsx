interface Props {
  value: string | null;
  unit?: string;
  inverse?: boolean;
  vsLabel?: string;
}

export default function DeltaBadge({ value, unit = "", inverse = false, vsLabel = "vs prev" }: Props) {
  if (!value) return <span className="text-gray-400 text-xs">no prev data</span>;

  const isPositive = value.startsWith("+");
  const isGood = inverse ? !isPositive : isPositive;

  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded-full ${
        isGood ? "bg-green-900/40 text-green-400" : "bg-red-900/40 text-red-400"
      }`}
    >
      {isPositive ? "▲" : "▼"} {value.replace(/^[+-]/, "")}
      {unit} {vsLabel}
    </span>
  );
}
