import { WorkoutEntry } from "@/lib/notion";

export default function WorkoutList({ workouts }: { workouts: WorkoutEntry[] }) {
  const grouped = workouts.reduce<Record<string, WorkoutEntry[]>>((acc, w) => {
    acc[w.date] = [...(acc[w.date] ?? []), w];
    return acc;
  }, {});

  const days = Object.keys(grouped).sort().reverse();

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-semibold mb-4">Workouts this week</h3>
      {days.length === 0 ? (
        <p className="text-gray-600 text-sm">No workouts logged this week</p>
      ) : (
        <div className="flex flex-col gap-4">
          {days.map((date) => (
            <div key={date}>
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{date}</p>
              <div className="flex flex-col gap-1">
                {grouped[date].map((w, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-indigo-400 font-medium min-w-[80px]">{w.level || "—"}</span>
                    <span className="text-white">{w.exercise || "—"}</span>
                    {w.reps && (
                      <span className="text-gray-400 ml-auto">{w.reps} reps</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
