import { checkConnections, checkToken, fetchFoodLog, fetchStepsLog, fetchWeightLog, fetchWorkoutLog } from "@/lib/notion";
import { buildDashboard, daysAgo } from "@/lib/utils";
import TodaySnapshot from "@/components/TodaySnapshot";
import WeightChart from "@/components/WeightChart";
import CalorieChart from "@/components/CalorieChart";
import ProteinChart from "@/components/ProteinChart";
import StepsChart from "@/components/StepsChart";
import WorkoutList from "@/components/WorkoutList";

export const dynamic = "force-dynamic";

const REQUIRED_ENV = ["NOTION_TOKEN"] as const;

function SetupError({ missing }: { missing: string[] }) {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-900 border border-red-500/40 rounded-2xl p-8 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h1 className="text-xl font-bold text-red-400">Notion API not configured</h1>
        </div>

        <p className="text-gray-400 text-sm leading-relaxed">
          The following environment variables are missing. Add them in your Vercel project settings and redeploy.
        </p>

        <ul className="flex flex-col gap-1">
          {missing.map((key) => (
            <li key={key} className="font-mono text-sm bg-gray-800 rounded-lg px-3 py-2 text-yellow-300">
              {key}
            </li>
          ))}
        </ul>

        <ol className="text-gray-400 text-sm leading-relaxed list-decimal list-inside space-y-1">
          <li>Go to <span className="text-gray-200">notion.so/my-integrations</span> and create an integration</li>
          <li>Copy the <span className="font-mono text-gray-200">Internal Integration Token</span> → <span className="font-mono text-yellow-300">NOTION_TOKEN</span></li>
          <li>Share each health database with the integration inside Notion</li>
          <li>Add <span className="font-mono text-yellow-300">NOTION_TOKEN</span> to Vercel and redeploy</li>
        </ol>
      </div>
    </main>
  );
}

function FetchError({
  message,
  token,
  connections,
}: {
  message: string;
  token: { ok: boolean; detail: string };
  connections: Record<string, "ok" | string>;
}) {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-gray-900 border border-red-500/40 rounded-2xl p-8 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h1 className="text-xl font-bold text-red-400">Failed to load dashboard</h1>
        </div>

        <div className="flex items-center gap-3 bg-gray-800 rounded-lg px-3 py-2">
          {token.ok
            ? <span className="text-green-400 text-lg">✓</span>
            : <span className="text-red-400 text-lg">✗</span>}
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-gray-200">Notion token</span>
            <span className={`text-xs ${token.ok ? "text-green-400" : "text-red-300"}`}>{token.detail}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-gray-400 text-xs uppercase tracking-wide font-semibold">Database connections</p>
          {Object.entries(connections).map(([name, status]) => (
            <div key={name} className="flex items-start gap-3 bg-gray-800 rounded-lg px-3 py-2">
              {status === "ok"
                ? <span className="text-green-400 mt-0.5">✓</span>
                : <span className="text-red-400 mt-0.5">✗</span>}
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm text-gray-200">{name}</span>
                {status !== "ok" && (
                  <span className="text-xs text-red-300 break-words">{status}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <p className="text-gray-400 text-sm leading-relaxed">
          For any ✗ database, open it in Notion → <span className="text-gray-200">⋯ menu → Connections</span> and add your integration.
        </p>

        <pre className="bg-gray-800 rounded-lg px-3 py-2 text-xs text-red-300 overflow-auto whitespace-pre-wrap">{message}</pre>
      </div>
    </main>
  );
}

export default async function DashboardPage() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    return <SetupError missing={missing} />;
  }

  let data;
  try {
    const start = daysAgo(13);
    const [weights, foods, workouts, steps] = await Promise.all([
      fetchWeightLog(start),
      fetchFoodLog(start),
      fetchWorkoutLog(start),
      fetchStepsLog(start),
    ]);
    data = buildDashboard(weights, foods, workouts, steps);
  } catch (err) {
    const [token, connections] = await Promise.all([checkToken(), checkConnections()]);
    return <FetchError message={err instanceof Error ? err.message : String(err)} token={token} connections={connections} />;
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Health Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Synced from Notion</p>
        </div>

        <TodaySnapshot data={data} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <WeightChart data={data.weightSeries} />
          <StepsChart data={data.stepsSeries} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <CalorieChart data={data.calorieSeries} />
          <ProteinChart data={data.calorieSeries} />
        </div>

        <WorkoutList workouts={data.weekWorkouts} />
      </div>
    </main>
  );
}
