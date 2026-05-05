import { NextResponse } from "next/server";
import { fetchFoodLog, fetchStepsLog, fetchWeightLog, fetchWorkoutLog } from "@/lib/notion";
import { buildDashboard, daysAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const start = daysAgo(13); // 14 days of data
    const [weights, foods, workouts, steps] = await Promise.all([
      fetchWeightLog(start),
      fetchFoodLog(start),
      fetchWorkoutLog(start),
      fetchStepsLog(start),
    ]);
    const data = buildDashboard(weights, foods, workouts, steps);
    return NextResponse.json(data);
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
