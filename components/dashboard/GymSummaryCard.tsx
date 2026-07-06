import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Dumbbell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getWorkouts } from "@/lib/actions/gym";

export async function GymSummaryCard() {
  const workouts = await getWorkouts(1);
  const lastWorkout = workouts[0];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Gym</CardTitle>
        <Link
          href="/gym"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Log <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {lastWorkout ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{lastWorkout.name}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(lastWorkout.started_at), "MMM d, yyyy")}
              {lastWorkout.workout_sets?.length
                ? ` · ${lastWorkout.workout_sets.length} sets`
                : ""}
            </p>
            {lastWorkout.muscle_groups?.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {lastWorkout.muscle_groups.join(", ")}
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <p className="text-sm text-muted-foreground">No workouts logged yet.</p>
            <Link href="/gym" className={cn(buttonVariants({ size: "sm" }))}>
              Log Workout
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
