import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Dumbbell, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { GymHealthInsightCard } from "@/components/gym/GymHealthInsightCard";
import { cn } from "@/lib/utils";
import { buildGymHealthInsight } from "@/lib/gym/health-crossover";
import { suggestNextSplit } from "@/lib/gym/suggestions";
import { formatSplit } from "@/lib/gym/format";
import type { DashboardSummary, HealthDailySnapshot, WorkoutSplit } from "@/types";
import type { Workout } from "@/types/gym";

export function GymSummaryCard({
  summary,
  snapshots = [],
}: {
  summary: DashboardSummary;
  snapshots?: HealthDailySnapshot[];
}) {
  const lastWorkout = summary.card_data.gym_last_workout;
  const today = format(new Date(), "yyyy-MM-dd");
  const todaySnapshot = snapshots.find((row) => row.date === today);
  const suggestedSplit = lastWorkout?.split
    ? suggestNextSplit([
        {
          split: lastWorkout.split,
          completed_at: lastWorkout.started_at,
        } as Workout,
      ])
    : "push";

  const insight = buildGymHealthInsight(
    snapshots,
    {
      suggestedSplit,
      weeklyWorkouts: summary.weekly_workouts,
      lastWorkoutDate: lastWorkout
        ? format(new Date(lastWorkout.started_at), "yyyy-MM-dd")
        : null,
    },
    todaySnapshot?.readiness_score ?? summary.readiness_score,
    todaySnapshot?.hrv_ms != null
      ? Number(todaySnapshot.hrv_ms)
      : summary.latest_hrv != null
        ? Number(summary.latest_hrv)
        : null,
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Gym</CardTitle>
        <Link
          href="/gym"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Open <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {insight.level !== "unavailable" && (
          <GymHealthInsightCard insight={insight} compact />
        )}
        {lastWorkout ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{lastWorkout.name}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(lastWorkout.started_at), "MMM d, yyyy")}
              {lastWorkout.split &&
                ` · ${formatSplit(lastWorkout.split as WorkoutSplit)}`}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                {summary.gym_streak}d streak
              </span>
              <span>{summary.weekly_workouts} this week</span>
              {summary.latest_body_weight != null && (
                <span>{summary.latest_body_weight} lbs</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm text-muted-foreground">
              No workouts logged yet.
            </p>
            <Link href="/gym" className={cn(buttonVariants({ size: "sm" }))}>
              Start Workout
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
