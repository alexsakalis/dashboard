import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { WorkoutRecoveryInsight } from "@/lib/gym/recovery-insight";

export function RecoveryInsightsCard({
  insights,
}: {
  insights: WorkoutRecoveryInsight[];
}) {
  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Activity className="h-4 w-4" />
            <p className="text-sm">Connect Oura to see how workouts affect next-day readiness.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="section-label">Training & recovery</h2>
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {insights.map((insight) => (
            <Link
              key={insight.workoutId}
              href={`/gym/${insight.workoutId}`}
              className="block px-4 py-3 transition-colors hover:bg-muted/50"
            >
              <p className="text-sm font-medium">{insight.workoutName}</p>
              <p className="text-xs text-muted-foreground">
                {format(parseISO(`${insight.workoutDate}T12:00:00`), "MMM d, yyyy")}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{insight.message}</p>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
