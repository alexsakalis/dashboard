import { notFound } from "next/navigation";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  getWorkout,
  getLastWorkoutReference,
  enrichWorkout,
} from "@/lib/actions/gym";
import { ActiveWorkoutLogger } from "@/components/gym/ActiveWorkoutLogger";
import { CompleteWorkoutSheet } from "@/components/gym/CompleteWorkoutSheet";
import { DeleteWorkoutDialog } from "@/components/gym/DeleteWorkoutDialog";
import { formatSplit } from "@/lib/gym/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await getWorkout(id);
  if (!workout) notFound();

  const enriched = enrichWorkout(workout);
  const isActive = !workout.completed_at;
  const lastRef = workout.split
    ? await getLastWorkoutReference(workout.split)
    : null;

  const reference =
    lastRef?.workoutId !== workout.id ? lastRef : null;

  return (
    <>
      <PageHeader
        title={workout.name}
        subtitle={format(new Date(workout.started_at), "MMM d, yyyy")}
        action={
          <div className="flex items-center gap-2">
            {isActive ? (
              <CompleteWorkoutSheet workoutId={workout.id} />
            ) : (
              <DeleteWorkoutDialog workoutId={workout.id} />
            )}
          </div>
        }
      />
      <main className="px-4 py-4">
        <div className="mb-4 flex flex-wrap gap-2">
          {workout.split && (
            <Badge variant="secondary">{formatSplit(workout.split)}</Badge>
          )}
          {enriched.durationLabel && (
            <Badge variant="outline">{enriched.durationLabel}</Badge>
          )}
          {workout.overall_rpe && (
            <Badge variant="outline">RPE {workout.overall_rpe}</Badge>
          )}
        </div>

        {!isActive && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Summary</p>
              <p className="mt-1 font-medium tabular-nums">
                {enriched.workingSets} working sets ·{" "}
                {Math.round(enriched.totalVolume).toLocaleString()} lb volume
              </p>
              {workout.body_weight && (
                <p className="text-sm text-muted-foreground">
                  Body weight: {workout.body_weight} {workout.body_weight_unit}
                </p>
              )}
              {workout.notes && (
                <p className="mt-2 text-sm">{workout.notes}</p>
              )}
            </CardContent>
          </Card>
        )}

        <ActiveWorkoutLogger workout={workout} lastReference={reference} />
      </main>
    </>
  );
}
