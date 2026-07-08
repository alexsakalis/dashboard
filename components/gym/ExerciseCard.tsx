"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  addWorkoutSet,
  removeWorkoutExercise,
  reorderExercises,
} from "@/lib/actions/gym";
import { SetRow, SetRowHeader } from "@/components/gym/SetRow";
import { PreviousPerformanceHint } from "@/components/gym/PreviousPerformanceHint";
import { MuscleGroupBadge } from "@/components/gym/MuscleGroupBadge";
import type { WorkoutExercise, WorkoutSet } from "@/types/gym";

interface ExerciseCardProps {
  exercise: WorkoutExercise;
  workoutId: string;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  allExerciseIds: string[];
  previousSets?: { reps: number | null; weight: number | null; isWarmup: boolean }[];
}

export function ExerciseCard({
  exercise,
  workoutId,
  isActive,
  isFirst,
  isLast,
  allExerciseIds,
  previousSets,
}: ExerciseCardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const sets = [...(exercise.workout_sets ?? [])].sort(
    (a, b) => a.set_number - b.set_number,
  );

  function addSet() {
    const nextNumber = sets.length + 1;
    const lastSet = sets[sets.length - 1];
    const formData = new FormData();
    formData.set("workout_id", workoutId);
    formData.set("workout_exercise_id", exercise.id);
    formData.set("exercise_name", exercise.exercise_name);
    formData.set("set_number", String(nextNumber));
    formData.set("reps", String(lastSet?.reps ?? ""));
    formData.set("weight", String(lastSet?.weight ?? ""));

    startTransition(async () => {
      await addWorkoutSet(formData);
      router.refresh();
    });
  }

  function removeExercise() {
    if (!confirm(`Remove ${exercise.exercise_name}?`)) return;
    startTransition(async () => {
      await removeWorkoutExercise(exercise.id, workoutId);
      router.refresh();
    });
  }

  function move(direction: "up" | "down") {
    const idx = allExerciseIds.indexOf(exercise.id);
    if (idx < 0) return;
    const newOrder = [...allExerciseIds];
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];

    startTransition(async () => {
      await reorderExercises(workoutId, newOrder);
      router.refresh();
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">{exercise.exercise_name}</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <MuscleGroupBadge group={exercise.muscle_group} />
            {previousSets && previousSets.length > 0 && (
              <PreviousPerformanceHint sets={previousSets} />
            )}
          </div>
        </div>
        {isActive && (
          <div className="flex shrink-0 items-center gap-0.5">
            {!isFirst && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => move("up")}
                aria-label="Move up"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            )}
            {!isLast && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => move("down")}
                aria-label="Move down"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={removeExercise}
              aria-label="Remove exercise"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <SetRowHeader />
        {sets.map((set) => (
          <SetRow
            key={set.id}
            set={set}
            workoutId={workoutId}
            isActive={isActive}
          />
        ))}
        {sets.length === 0 && (
          <p className="py-2 text-center text-xs text-muted-foreground">
            No sets yet
          </p>
        )}
        {isActive && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-2 w-full"
            onClick={addSet}
            disabled={isPending}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add set
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
