import { DashboardData } from "@/lib/utils";
import StatCard from "./StatCard";
import Link from "next/link";

export default function TodaySnapshot({ data }: { data: DashboardData }) {
  const workoutSummary = (workouts: typeof data.todayWorkouts) => {
    if (!workouts.length) return null;
    return workouts.map((w) => {
      const name = w.exercise || w.level || "Workout";
      return w.reps ? `${name} ×${w.reps}` : name;
    }).join(", ");
  };

  const weight = data.todayWeight?.weight ?? data.latestWeight?.weight ?? null;
  const weightStale = !data.todayWeight ? data.latestWeight?.date : null;

  const calories = data.todayCalories ?? data.latestCalories?.calories ?? null;
  const caloriesStale = !data.todayCalories ? data.latestCalories?.date : null;

  const steps = data.todaySteps?.steps ?? data.latestSteps?.steps ?? null;
  const stepsStale = !data.todaySteps ? data.latestSteps?.date : null;

  const activeWorkouts = data.todayWorkouts.length ? data.todayWorkouts : data.latestWorkouts?.workouts ?? [];
  const workoutStale = !data.todayWorkouts.length ? data.latestWorkouts?.date : null;

  return (
    <section>
      <h2 className="text-gray-400 text-sm uppercase tracking-widest mb-3">
        Today — {data.today}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(
          [
            { href: "/weight", card: <StatCard icon="⚖️" label="Weight" accent="bg-emerald-400" value={weight?.toString() ?? null} unit="kg" delta={data.deltas.weight} deltaUnit=" kg" deltaLabel={data.deltas.weightLabel ?? undefined} inverse staleDate={weightStale} /> },
            { href: "/food",   card: <StatCard icon="🔥" label="Calories" accent="bg-amber-400" value={calories?.toString() ?? null} unit="kcal" delta={data.deltas.calories} deltaUnit=" kcal" deltaLabel={data.deltas.caloriesLabel ?? undefined} inverse staleDate={caloriesStale} /> },
            { href: "/steps",  card: <StatCard icon="👟" label="Steps" accent="bg-sky-400" value={steps?.toLocaleString() ?? null} delta={data.deltas.steps} deltaUnit=" steps" staleDate={stepsStale} /> },
            { href: "/workout",card: <StatCard icon="💪" label="Workout" accent="bg-indigo-400" value={workoutSummary(activeWorkouts) ?? "Rest day"} staleDate={workoutStale} /> },
          ] as const
        ).map(({ href, card }) => (
          <Link key={href} href={href} className="block hover:opacity-80 transition-opacity">
            {card}
          </Link>
        ))}
      </div>
    </section>
  );
}
