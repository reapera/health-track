"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface Entry {
  date: string;
  calories: number;
  protein: number;
}

export default function CalorieChart({ data }: { data: Entry[] }) {
  const formatted = data.map((d) => ({ ...d, label: d.date.slice(5) }));

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Calories & Protein (this week)</h3>
      {formatted.every((d) => d.calories === 0) ? (
        <p className="text-gray-600 text-sm">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#9ca3af" }}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: "#9ca3af" }} />
            <Bar dataKey="calories" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Calories (kcal)" />
            <Bar dataKey="protein" fill="#6366f1" radius={[4, 4, 0, 0]} name="Protein (g)" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
