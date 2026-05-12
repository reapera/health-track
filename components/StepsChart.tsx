"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

interface Entry { date: string; steps: number }
interface Props {
  data: Entry[];
  activeDate?: string | null;
  onActiveDate?: (date: string | null) => void;
  onClickDate?: (date: string | null) => void;
}

export default function StepsChart({ data, activeDate, onActiveDate, onClickDate }: Props) {
  const formatted = data.map((d) => ({ ...d, label: d.date.slice(5) }));
  const goal = 10000;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-1">Steps (this week)</h3>
      <p className="text-gray-500 text-xs mb-4">Goal: {goal.toLocaleString()} steps/day</p>
      {formatted.every((d) => d.steps === 0) ? (
        <p className="text-gray-600 text-sm">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={formatted}
            onMouseMove={(s: any) => onActiveDate?.(s.activePayload?.[0]?.payload?.date ?? null)}
            onMouseLeave={() => onActiveDate?.(null)}
            onClick={(s: any) => onClickDate?.(s.activePayload?.[0]?.payload?.date ?? null)}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#9ca3af" }}
              itemStyle={{ color: "#38bdf8" }}
              formatter={(v) => [typeof v === "number" ? v.toLocaleString() : v, "Steps"]}
            />
            <ReferenceLine y={goal} stroke="#4ade80" strokeDasharray="4 4" label={{ value: "Goal", fill: "#4ade80", fontSize: 10 }} />
            <Bar dataKey="steps" radius={[4, 4, 0, 0]}>
              {formatted.map((entry, i) => (
                <Cell key={i} fill="#38bdf8" opacity={!activeDate || entry.date === activeDate ? 1 : 0.25} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
