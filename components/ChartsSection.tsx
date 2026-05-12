"use client";

import { useState } from "react";
import WeightChart from "./WeightChart";
import StepsChart from "./StepsChart";
import CalorieChart from "./CalorieChart";
import ProteinChart from "./ProteinChart";
import WorkoutList from "./WorkoutList";
import type { WorkoutEntry } from "@/lib/notion";

interface Props {
  weightSeries: { date: string; weight: number | null; bodyFat: string }[];
  calorieSeries: { date: string; calories: number; protein: number }[];
  stepsSeries: { date: string; steps: number }[];
  weekWorkouts: WorkoutEntry[];
}

export default function ChartsSection({ weightSeries, calorieSeries, stepsSeries, weekWorkouts }: Props) {
  const [activeDate, setActiveDate] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeightChart data={weightSeries} activeDate={activeDate} onActiveDate={setActiveDate} />
        <StepsChart data={stepsSeries} activeDate={activeDate} onActiveDate={setActiveDate} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalorieChart data={calorieSeries} activeDate={activeDate} onActiveDate={setActiveDate} />
        <ProteinChart data={calorieSeries} activeDate={activeDate} onActiveDate={setActiveDate} />
      </div>
      <WorkoutList workouts={weekWorkouts} />
    </>
  );
}
