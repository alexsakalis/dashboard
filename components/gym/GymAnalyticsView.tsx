import { Card, CardContent } from "@/components/ui/card";
import type { GymAnalyticsSummary } from "@/lib/gym/analytics";

export function GymAnalyticsView({
  analytics,
}: {
  analytics: GymAnalyticsSummary;
}) {
  const maxVolume = Math.max(...analytics.weeklyVolume.map((w) => w.volume), 1);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">This week</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {Math.round(analytics.totalVolumeThisWeek).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">lb volume</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Workouts</p>
            <p className="mt-1 text-xl font-bold tabular-nums">
              {analytics.totalWorkoutsThisWeek}
            </p>
            {analytics.avgWorkoutDurationMinutes != null && (
              <p className="text-xs text-muted-foreground">
                ~{analytics.avgWorkoutDurationMinutes} min avg
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <h2 className="section-label">Weekly volume</h2>
        <Card>
          <CardContent className="space-y-3 p-4">
            {analytics.weeklyVolume.map((week) => (
              <div key={week.weekStart} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{week.label}</span>
                  <span className="tabular-nums">
                    {Math.round(week.volume).toLocaleString()} lb
                    {week.workouts > 0 && (
                      <span className="text-muted-foreground">
                        {" "}
                        · {week.workouts} sessions
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(week.volume / maxVolume) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {analytics.muscleGroups.length > 0 && (
        <div className="space-y-2">
          <h2 className="section-label">Muscle groups this week</h2>
          <Card>
            <CardContent className="divide-y divide-border p-0">
              {analytics.muscleGroups.map((group) => (
                <div
                  key={group.muscleGroup}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {group.muscleGroup.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {group.sets} working sets
                    </p>
                  </div>
                  <p className="text-sm font-semibold tabular-nums">
                    {Math.round(group.volume).toLocaleString()} lb
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
