import Link from "next/link";
import { fetchWeightLog } from "@/lib/notion";
import { today, daysAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function WeightPage() {
  const entries = await fetchWeightLog(daysAgo(59));
  const td = today();

  const todayEntry = entries.filter((e) => e.date === td).at(-1) ?? null;
  const history = entries.filter((e) => e.date !== td).reverse().slice(0, 30);

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-2xl mx-auto flex flex-col gap-8">

        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-white text-sm transition-colors">← Dashboard</Link>
          <h1 className="text-2xl font-bold">Weight Log</h1>
        </div>

        <section className="flex flex-col gap-2">
          <p className="text-gray-400 text-xs uppercase tracking-widest">Today — {td}</p>
          {todayEntry ? (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-500 text-xs mb-1">Weight</p>
                <p className="text-2xl font-bold">{todayEntry.weight ?? "—"} <span className="text-gray-400 text-base">kg</span></p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Body Fat</p>
                <p className="text-2xl font-bold">{todayEntry.bodyFat || "—"}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-1">Note</p>
                <p className="text-sm text-gray-300">{todayEntry.note || "—"}</p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 text-gray-500 text-sm">No entry today</div>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <p className="text-gray-400 text-xs uppercase tracking-widest">History (last {history.length} entries)</p>
          {history.length === 0 ? (
            <p className="text-gray-600 text-sm">No previous entries</p>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-500 text-xs uppercase">
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-right px-4 py-3">Weight</th>
                    <th className="text-right px-4 py-3">Body Fat</th>
                    <th className="text-left px-4 py-3">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((e, i) => (
                    <tr key={i} className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/30">
                      <td className="px-4 py-3 font-mono text-gray-400">{e.date}</td>
                      <td className="px-4 py-3 text-right font-semibold">{e.weight != null ? `${e.weight} kg` : "—"}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{e.bodyFat || "—"}</td>
                      <td className="px-4 py-3 text-gray-400">{e.note || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
