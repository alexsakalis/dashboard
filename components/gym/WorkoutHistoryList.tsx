import Link from "next/link";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatSplit } from "@/lib/gym/format";
import type { Workout } from "@/types/gym";

export function WorkoutHistoryList({ workouts }: { workouts: Workout[] }) {
  if (workouts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No workouts found for this filter.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {workouts.map((workout) => (
        <Link key={workout.id} href={`/gym/${workout.id}`}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">{workout.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(workout.started_at), "MMM d, yyyy")}
                  </p>
                </div>
                {workout.split && (
                  <Badge variant="secondary" className="text-xs">
                    {formatSplit(workout.split)}
                  </Badge>
                )}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {(workout.workout_sets ?? []).length} sets
                {workout.duration_seconds
                  ? ` · ${Math.round(workout.duration_seconds / 60)} min`
                  : ""}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
