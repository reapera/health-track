import { fetchFoodLog, fetchStepsLog, fetchWeightLog, fetchWorkoutLog } from "@/lib/notion";
import { buildDashboard, daysAgo } from "@/lib/utils";
import TodaySnapshot from "@/components/TodaySnapshot";
import WeightChart from "@/components/WeightChart";
import CalorieChart from "@/components/CalorieChart";
import StepsChart from "@/components/StepsChart";
import WorkoutList from "@/components/WorkoutList";

export const revalidate = 300;

export default async function DashboardPage() {
  const start = daysAgo(13);

  const [weights, foods, workouts, steps] = await Promise.all([
    fetchWeightLog(start),
    fetchFoodLog(start),
    fetchWorkoutLog(start),
    fetchStepsLog(start),
  ]);

  const data = buildDashboard(weights, foods, workouts, steps);

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
          <CalorieChart data={data.calorieSeries} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StepsChart data={data.stepsSeries} />
          <WorkoutList workouts={data.weekWorkouts} />
        </div>
      </div>
    </main>
  );
}
