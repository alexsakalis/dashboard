import { SparklineChart } from "@/components/gym/charts/SparklineChart";
import type { ProgressChartPoint } from "@/types/gym";

export function ExerciseProgressChart({
  points,
  title = "Estimated 1RM",
}: {
  points: ProgressChartPoint[];
  title?: string;
}) {
  return (
    <SparklineChart
      points={points}
      title={title}
      formatValue={(v) => `${Math.round(v)} lbs`}
    />
  );
}

export function BodyWeightChart({
  points,
}: {
  points: ProgressChartPoint[];
}) {
  return (
    <SparklineChart
      points={points}
      title="Body weight"
      formatValue={(v) => `${v.toFixed(1)} lbs`}
    />
  );
}
