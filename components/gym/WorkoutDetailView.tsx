"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Check } from "lucide-react";
import { ActiveWorkoutLogger } from "@/components/gym/ActiveWorkoutLogger";
import { CompleteWorkoutSheet } from "@/components/gym/CompleteWorkoutSheet";
import { DeleteWorkoutDialog } from "@/components/gym/DeleteWorkoutDialog";
import { WorkoutElapsedTimer } from "@/components/gym/WorkoutElapsedTimer";
import { PlateCalculatorSheet } from "@/components/gym/PlateCalculatorSheet";
import { formatSplit, formatWeight } from "@/lib/gym/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  EnrichedWorkout,
  ExercisePersonalRecord,
  GymPreferences,
  LastWorkoutReference,
  Workout,
} from "@/types/gym";

interface WorkoutDetailViewProps {
  workout: Workout;
  enriched: EnrichedWorkout;
  lastReference: LastWorkoutReference | null;
  existingPRs: ExercisePersonalRecord[];
  preferences: GymPreferences | null;
  defaultRestSeconds: number;
}

export function WorkoutDetailView({
  workout,
  enriched,
  lastReference,
  existingPRs,
  preferences,
  defaultRestSeconds,
}: WorkoutDetailViewProps) {
  const [editMode, setEditMode] = useState(false);
  const isActive = !workout.completed_at;
  const weightUnit = preferences?.default_weight_unit ?? "lbs";

  return (
    <>
      <div className="sticky top-0 z-40 bg-background/85 px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl supports-backdrop-filter:bg-background/60">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-[1.35rem] font-semibold tracking-tight">
              {workout.name}
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {format(new Date(workout.started_at), "MMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isActive ? (
              <>
                <PlateCalculatorSheet
                  defaultUnit={weightUnit === "kg" ? "kg" : "lbs"}
                />
                <DeleteWorkoutDialog workoutId={workout.id} mode="active" />
                <CompleteWorkoutSheet workoutId={workout.id} />
              </>
            ) : (
              <>
                <PlateCalculatorSheet
                  defaultUnit={weightUnit === "kg" ? "kg" : "lbs"}
                />
                <Button
                  type="button"
                  variant={editMode ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setEditMode((v) => !v)}
                >
                  {editMode ? (
                    <>
                      <Check className="mr-1 h-3.5 w-3.5" />
                      Done
                    </>
                  ) : (
                    <>
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </>
                  )}
                </Button>
                <DeleteWorkoutDialog workoutId={workout.id} />
              </>
            )}
          </div>
        </div>
      </div>

      <main className="px-4 py-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {workout.split && (
            <Badge variant="secondary">{formatSplit(workout.split)}</Badge>
          )}
          {isActive && (
            <WorkoutElapsedTimer startedAt={workout.started_at} />
          )}
          {!isActive && enriched.durationLabel && (
            <Badge variant="outline">{enriched.durationLabel}</Badge>
          )}
          {workout.overall_rpe && (
            <Badge variant="outline">RPE {workout.overall_rpe}</Badge>
          )}
          {!isActive && editMode && (
            <Badge variant="outline" className="border-primary/40 text-primary">
              Editing
            </Badge>
          )}
        </div>

        {!isActive && !editMode && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Summary</p>
              <p className="mt-1 font-medium tabular-nums">
                {enriched.workingSets} working sets ·{" "}
                {Math.round(enriched.totalVolume).toLocaleString()} {weightUnit} volume
              </p>
              {workout.body_weight && (
                <p className="text-sm text-muted-foreground">
                  Body weight: {formatWeight(workout.body_weight, workout.body_weight_unit)}
                </p>
              )}
              {workout.notes && (
                <p className="mt-2 text-sm">{workout.notes}</p>
              )}
            </CardContent>
          </Card>
        )}

        {editMode && !isActive && (
          <p className="mb-4 text-sm text-muted-foreground">
            Fix sets below — personal records will recalculate when you save changes.
          </p>
        )}

        <ActiveWorkoutLogger
          workout={workout}
          lastReference={lastReference}
          existingPRs={existingPRs}
          defaultRestSeconds={defaultRestSeconds}
          editMode={editMode}
          weightUnit={weightUnit}
        />
      </main>
    </>
  );
}
