import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SparklineChart } from "@/components/gym/charts/SparklineChart";
import type { ExerciseProgressSummary } from "@/types/gym";

export function TopProgressingList({
  exercises,
}: {
  exercises: ExerciseProgressSummary[];
}) {
  if (exercises.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="section-label">Top progressing</h2>
        <Link
          href="/gym/analytics"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Analytics →
        </Link>
      </div>
      {exercises.map((ex) => (
        <Link key={ex.exerciseName} href={`/gym/progress/${encodeURIComponent(ex.exerciseName)}`}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="p-3">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                <p className="text-sm font-medium">{ex.exerciseName}</p>
              </div>
              {ex.chartPoints.length >= 2 && (
                <SparklineChart
                  points={ex.chartPoints}
                  title="Est. 1RM trend"
                  formatValue={(v) => `${Math.round(v)}`}
                  height={40}
                />
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
