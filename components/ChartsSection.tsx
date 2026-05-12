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
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [pinnedDate, setPinnedDate] = useState<string | null>(null);

  const activeDate = hoverDate ?? pinnedDate;

  const handleClick = (date: string | null) => {
    setPinnedDate((prev) => (prev === date ? null : date));
  };

  const chartProps = {
    activeDate,
    onActiveDate: setHoverDate,
    onClickDate: handleClick,
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeightChart data={weightSeries} {...chartProps} />
        <StepsChart data={stepsSeries} {...chartProps} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalorieChart data={calorieSeries} {...chartProps} />
        <ProteinChart data={calorieSeries} {...chartProps} />
      </div>
      <WorkoutList workouts={weekWorkouts} />
    </>
  );
}
