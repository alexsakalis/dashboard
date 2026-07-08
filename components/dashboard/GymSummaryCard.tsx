import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Dumbbell, Flame, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getGymDashboard } from "@/lib/actions/gym";
import { formatSplit, formatWeight } from "@/lib/gym/format";

export async function GymSummaryCard() {
  const summary = await getGymDashboard();
  const lastWorkout = summary.lastWorkout;

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
      <CardContent>
        {lastWorkout ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{lastWorkout.name}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(lastWorkout.started_at), "MMM d, yyyy")}
              {lastWorkout.split && ` · ${formatSplit(lastWorkout.split)}`}
            </p>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                {summary.trainingStreak}d streak
              </span>
              <span>{summary.weeklyWorkoutCount} this week</span>
              {summary.latestBodyWeight && (
                <span>
                  {formatWeight(
                    summary.latestBodyWeight.weight,
                    summary.latestBodyWeight.unit,
                  )}
                </span>
              )}
              {summary.recentPRs.length > 0 && (
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {summary.recentPRs.length} PRs
                </span>
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
