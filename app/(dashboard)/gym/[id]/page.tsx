import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { AddSetForm } from "@/components/gym/AddSetForm";
import { CompleteWorkoutButton } from "@/components/gym/CompleteWorkoutButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkoutSet } from "@/types";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const supabase = await createClient();

  const { data: workout } = await supabase
    .from("workouts")
    .select("*, workout_sets(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!workout) notFound();

  const setsByExercise = (workout.workout_sets ?? []).reduce(
    (acc: Record<string, WorkoutSet[]>, set: WorkoutSet) => {
      if (!acc[set.exercise_name]) acc[set.exercise_name] = [];
      acc[set.exercise_name].push(set);
      return acc;
    },
    {} as Record<string, WorkoutSet[]>,
  );

  return (
    <>
      <PageHeader
        title={workout.name}
        subtitle={format(new Date(workout.started_at), "MMM d, yyyy")}
        action={
          !workout.completed_at ? (
            <CompleteWorkoutButton workoutId={workout.id} />
          ) : undefined
        }
      />
      <main className="space-y-4 px-4 py-4">
        {!workout.completed_at && <AddSetForm workoutId={workout.id} />}

        {(Object.entries(setsByExercise) as [string, WorkoutSet[]][]).map(
          ([exercise, sets]) => (
          <Card key={exercise}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{exercise}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {sets
                  ?.sort((a, b) => a.set_number - b.set_number)
                  .map((set) => (
                    <div
                      key={set.id}
                      className="flex justify-between text-sm"
                    >
                      <span className="text-muted-foreground">
                        Set {set.set_number}
                      </span>
                      <span>
                        {set.reps} reps × {set.weight ?? 0} {set.unit}
                      </span>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
          ),
        )}

        {Object.keys(setsByExercise).length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Add your first set above.
          </p>
        )}
      </main>
    </>
  );
}
