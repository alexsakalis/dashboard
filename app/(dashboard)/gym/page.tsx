import Link from "next/link";
import { format } from "date-fns";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getWorkouts } from "@/lib/actions/gym";
import { CreateWorkoutDialog } from "@/components/gym/CreateWorkoutDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

async function WorkoutHistory() {
  const workouts = await getWorkouts(20);

  if (workouts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No workouts logged yet. Start your first session!
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => (
        <Link key={workout.id} href={`/gym/${workout.id}`}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{workout.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(workout.started_at), "MMM d, yyyy")}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {workout.muscle_groups?.map((group: string) => (
                    <Badge key={group} variant="secondary" className="text-xs">
                      {group}
                    </Badge>
                  ))}
                </div>
              </div>
              {workout.workout_sets && workout.workout_sets.length > 0 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {workout.workout_sets.length} sets logged
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

export default function GymPage() {
  return (
    <>
      <PageHeader
        title="Gym"
        subtitle="Log workouts & track progress"
        action={
          <div className="flex gap-2">
            <Link
              href="/gym/templates"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Templates
            </Link>
            <CreateWorkoutDialog />
          </div>
        }
      />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <WorkoutHistory />
        </Suspense>
      </main>
    </>
  );
}
