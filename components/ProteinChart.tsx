"use client";

import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Entry { date: string; calories: number; protein: number }
interface Props {
  data: Entry[];
  activeDate?: string | null;
  onActiveDate?: (date: string | null) => void;
  onClickDate?: (date: string | null) => void;
}

export default function ProteinChart({ data, activeDate, onActiveDate, onClickDate }: Props) {
  const formatted = data.map((d) => ({ ...d, label: d.date.slice(5) }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Protein (this week)</h3>
      {formatted.every((d) => d.protein === 0) ? (
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
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} unit="g" width={45} />
            <Tooltip
              contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#9ca3af" }}
              formatter={(v) => [`${v}g`, "Protein"]}
            />
            <Bar dataKey="protein" radius={[4, 4, 0, 0]}>
              {formatted.map((entry, i) => (
                <Cell key={i} fill="#6366f1" opacity={!activeDate || entry.date === activeDate ? 1 : 0.25} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
