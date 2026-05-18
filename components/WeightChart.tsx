"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine, Legend } from "recharts";

interface Entry { date: string; weight: number | null; bodyFat: string }
interface Props {
  data: Entry[];
  activeDate?: string | null;
  onActiveDate?: (date: string | null) => void;
  onClickDate?: (date: string | null) => void;
}

export default function WeightChart({ data, activeDate, onActiveDate, onClickDate }: Props) {
  const formatted = data
    .filter((d) => d.weight !== null || !!d.bodyFat)
    .map((d) => ({
      ...d,
      label: d.date.slice(5),
      bodyFatNum: parseFloat(d.bodyFat) || null,
    }));

  const hasBodyFat = formatted.some((d) => d.bodyFatNum !== null);
  const activeLabel = activeDate ? formatted.find((d) => d.date === activeDate)?.label : null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold">Weight (14 days)</h3>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-emerald-400 rounded"></span>Weight</span>
          {hasBodyFat && <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 bg-violet-400 rounded"></span>Body Fat</span>}
        </div>
      </div>
      {formatted.length === 0 ? (
        <p className="text-gray-600 text-sm">No data yet</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart
            data={formatted}
            onMouseMove={(s: any) => onActiveDate?.(s.activePayload?.[0]?.payload?.date ?? null)}
            onMouseLeave={() => onActiveDate?.(null)}
            onClick={(s: any) => onClickDate?.(s.activePayload?.[0]?.payload?.date ?? null)}
            margin={{ right: hasBodyFat ? 8 : 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis
              yAxisId="weight"
              stroke="#6b7280"
              tick={{ fontSize: 11 }}
              domain={["auto", "auto"]}
              tickFormatter={(v) => `${v}kg`}
              width={52}
            />
            {hasBodyFat && (
              <YAxis
                yAxisId="fat"
                orientation="right"
                stroke="#6b7280"
                tick={{ fontSize: 11 }}
                domain={["auto", "auto"]}
                tickFormatter={(v) => `${v}%`}
                width={36}
              />
            )}
            <Tooltip
              contentStyle={{ backgroundColor: "#111827", border: "1px solid #374151", borderRadius: 8 }}
              labelStyle={{ color: "#9ca3af" }}
              formatter={(v, name) =>
                name === "weight" ? [`${v} kg`, "Weight"] : [`${v}%`, "Body Fat"]
              }
            />
            {activeLabel && (
              <ReferenceLine yAxisId="weight" x={activeLabel} stroke="rgba(255,255,255,0.15)" strokeWidth={12} />
            )}
            <Line
              yAxisId="weight"
              type="monotone"
              dataKey="weight"
              stroke="#34d399"
              strokeWidth={2}
              connectNulls
              dot={({ cx, cy, payload }) => (
                <circle
                  key={`w-${payload.date}`}
                  cx={cx} cy={cy} r={3}
                  fill="#34d399"
                  opacity={!activeDate || payload.date === activeDate ? 1 : 0.25}
                />
              )}
              activeDot={{ r: 5 }}
            />
            {hasBodyFat && (
              <Line
                yAxisId="fat"
                type="monotone"
                dataKey="bodyFatNum"
                name="bodyFat"
                stroke="#a78bfa"
                strokeWidth={2}
                connectNulls
                dot={({ cx, cy, payload }) => (
                  payload.bodyFatNum !== null
                    ? <circle
                        key={`f-${payload.date}`}
                        cx={cx} cy={cy} r={3}
                        fill="#a78bfa"
                        opacity={!activeDate || payload.date === activeDate ? 1 : 0.25}
                      />
                    : <g key={`f-${payload.date}`} />
                )}
                activeDot={{ r: 5 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
