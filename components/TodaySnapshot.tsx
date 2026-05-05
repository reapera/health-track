import { DashboardData } from "@/lib/utils";
import StatCard from "./StatCard";

export default function TodaySnapshot({ data }: { data: DashboardData }) {
  const workoutSummary =
    data.todayWorkouts.length > 0
      ? data.todayWorkouts.map((w) => w.exercise || w.level || "Workout").join(", ")
      : null;

  return (
    <section>
      <h2 className="text-gray-400 text-sm uppercase tracking-widest mb-3">
        Today — {data.today}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon="⚖️"
          label="Weight"
          value={data.todayWeight?.weight?.toString() ?? null}
          unit="kg"
          delta={data.deltas.weight}
          deltaUnit=" kg"
          inverse
        />
        <StatCard
          icon="🔥"
          label="Calories"
          value={data.todayCalories?.toString() ?? null}
          unit="kcal"
          delta={data.deltas.calories}
          deltaUnit=" kcal"
          inverse
        />
        <StatCard
          icon="👟"
          label="Steps"
          value={data.todaySteps?.steps?.toLocaleString() ?? null}
          delta={data.deltas.steps}
          deltaUnit=" steps"
        />
        <StatCard
          icon="💪"
          label="Workout"
          value={workoutSummary ?? "Rest day"}
        />
      </div>
    </section>
  );
}
