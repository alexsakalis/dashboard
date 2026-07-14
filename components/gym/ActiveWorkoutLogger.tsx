"use client";

import { ExerciseCard } from "@/components/gym/ExerciseCard";
import { AddExerciseSheet } from "@/components/gym/AddExerciseSheet";
import { CompleteWorkoutSheet } from "@/components/gym/CompleteWorkoutSheet";
import { RestTimerBar } from "@/components/gym/RestTimerBar";
import { WorkoutElapsedTimer } from "@/components/gym/WorkoutElapsedTimer";
import { PlateCalculatorSheet } from "@/components/gym/PlateCalculatorSheet";
import { WorkoutSessionProvider } from "@/components/gym/WorkoutSessionProvider";
import type {
  ExercisePersonalRecord,
  LastWorkoutReference,
  Workout,
  WorkoutExercise,
} from "@/types/gym";
import { cn } from "@/lib/utils";

interface ActiveWorkoutLoggerProps {
  workout: Workout;
  lastReference?: LastWorkoutReference | null;
  existingPRs?: ExercisePersonalRecord[];
  defaultRestSeconds?: number;
  editMode?: boolean;
  weightUnit?: string;
}

export function ActiveWorkoutLogger({
  workout,
  lastReference,
  existingPRs = [],
  defaultRestSeconds,
  editMode = false,
  weightUnit = "lbs",
}: ActiveWorkoutLoggerProps) {
  const isActive = !workout.completed_at;
  const loggingEnabled = isActive || editMode;

  const exercises: WorkoutExercise[] = workout.workout_exercises?.length
    ? [...workout.workout_exercises].sort((a, b) => a.sort_order - b.sort_order)
    : [];

  const exerciseIds = exercises.map((e) => e.id);

  function getPreviousSets(exerciseName: string) {
    const ref = lastReference?.exercises.find(
      (e) => e.exerciseName.toLowerCase() === exerciseName.toLowerCase(),
    );
    return ref?.sets;
  }

  return (
    <WorkoutSessionProvider
      workoutId={workout.id}
      workoutName={workout.name}
      startedAt={workout.started_at}
      isActive={isActive}
      existingPRs={existingPRs}
      defaultRestSeconds={defaultRestSeconds}
    >
      <div className={cn("space-y-4", loggingEnabled && isActive ? "pb-24" : "pb-4")}>
        {isActive && (
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
            <p className="text-sm text-muted-foreground">Session timer</p>
            <WorkoutElapsedTimer startedAt={workout.started_at} />
          </div>
        )}

        {exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            workoutId={workout.id}
            isActive={loggingEnabled}
            sessionActive={isActive}
            isFirst={index === 0}
            isLast={index === exercises.length - 1}
            allExerciseIds={exerciseIds}
            previousSets={getPreviousSets(exercise.exercise_name)}
            weightUnit={weightUnit}
          />
        ))}

        {exercises.length === 0 && loggingEnabled && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Add your first exercise to start logging sets.
          </p>
        )}

        {isActive && (
          <>
            <RestTimerBar />
            <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-lg gap-2 px-4">
              <PlateCalculatorSheet
                defaultUnit={weightUnit === "kg" ? "kg" : "lbs"}
                triggerClassName="shrink-0"
              />
              <AddExerciseSheet workoutId={workout.id} workoutSplit={workout.split} />
              <CompleteWorkoutSheet workoutId={workout.id} />
            </div>
          </>
        )}
      </div>
    </WorkoutSessionProvider>
  );
}
