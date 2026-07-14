import Link from "next/link";
import { format } from "date-fns";
import { Flame, Calendar, Scale, Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatSplit, formatWeight } from "@/lib/gym/format";
import type { GymDashboardSummary } from "@/types/gym";

export function GymDashboardStats({
  summary,
}: {
  summary: GymDashboardSummary;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Card className="border-primary/15 bg-gradient-to-br from-card via-card to-primary/5">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Flame className="h-3.5 w-3.5" />
            <span className="text-xs">Streak</span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {summary.trainingStreak}
          </p>
          <p className="text-xs text-muted-foreground">days</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-xs">This week</span>
          </div>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {summary.weeklyWorkoutCount}
          </p>
          <p className="text-xs text-muted-foreground">workouts</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Scale className="h-3.5 w-3.5" />
            <span className="text-xs">Weight</span>
          </div>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {summary.latestBodyWeight
              ? formatWeight(summary.latestBodyWeight.weight, summary.latestBodyWeight.unit)
              : "—"}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" />
            <span className="text-xs">Recent PRs</span>
          </div>
          <p className="mt-1 text-lg font-semibold tabular-nums">
            {summary.recentPRs.length}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function LastWorkoutCard({
  summary,
}: {
  summary: GymDashboardSummary;
}) {
  const last = summary.lastWorkout;
  if (!last) return null;

  return (
    <Link href={`/gym/${last.id}`}>
      <Card className="transition-colors hover:bg-muted/50">
        <CardContent className="p-4">
          <p className="section-label mb-2">Last workout</p>
          <p className="font-medium">{last.name}</p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(last.completed_at ?? last.started_at), "MMM d, yyyy")}
            {last.split && ` · ${formatSplit(last.split)}`}
            {last.durationLabel && ` · ${last.durationLabel}`}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {last.workingSets} working sets · {Math.round(last.totalVolume).toLocaleString()} {summary.weightUnit} volume
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export function RecentPRsList({
  summary,
}: {
  summary: GymDashboardSummary;
}) {
  if (summary.recentPRs.length === 0) return null;

  return (
    <div className="space-y-2">
      <h2 className="section-label">Recent PRs</h2>
      {summary.recentPRs.map((pr) => (
        <Card key={pr.id}>
          <CardContent className="flex items-center justify-between p-3">
            <div>
              <p className="text-sm font-medium">{pr.exercise_name}</p>
              <p className="text-xs capitalize text-muted-foreground">
                {pr.record_type.replace(/_/g, " ")}
              </p>
            </div>
            <p className="font-semibold tabular-nums">
              {Math.round(pr.value)}
              {pr.record_type === "estimated_1rm" ? " est." : ""}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
