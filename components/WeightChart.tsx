"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

interface Entry { date: string; weight: number | null; bodyFat: string }
interface Props {
  data: Entry[];
  activeDate?: string | null;
  onActiveDate?: (date: string | null) => void;
}

export default function WeightChart({ data, activeDate, onActiveDate }: Props) {
  const formatted = data
    .filter((d) => d.weight !== null)
    .map((d) => ({ ...d, label: d.date.slice(5) }));

  const activeLabel = activeDate ? formatted.find((d) => d.date === activeDate)?.label : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Weight (14 days)</h3>
      {formatted.length === 0 ? (
        <p className="text-gray-600 text-sm">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={formatted}
            onMouseMove={(s) => onActiveDate?.(s.activePayload?.[0]?.payload?.date ?? null)}
            onMouseLeave={() => onActiveDate?.(null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} domain={["auto", "auto"]} tickFormatter={(v) => `${v}kg`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#9ca3af" }}
              itemStyle={{ color: "#34d399" }}
              formatter={(v) => [`${v} kg`, "Weight"]}
            />
            {activeLabel && (
              <ReferenceLine x={activeLabel} stroke="rgba(255,255,255,0.15)" strokeWidth={12} />
            )}
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#34d399"
              strokeWidth={2}
              dot={({ cx, cy, payload }) => (
                <circle
                  key={payload.date}
                  cx={cx} cy={cy} r={3}
                  fill="#34d399"
                  opacity={!activeDate || payload.date === activeDate ? 1 : 0.25}
                />
              )}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
