"use client";

import { ExerciseCard } from "@/components/gym/ExerciseCard";
import { AddExerciseSheet } from "@/components/gym/AddExerciseSheet";
import { CompleteWorkoutSheet } from "@/components/gym/CompleteWorkoutSheet";
import type { LastWorkoutReference, Workout, WorkoutExercise } from "@/types/gym";

interface ActiveWorkoutLoggerProps {
  workout: Workout;
  lastReference?: LastWorkoutReference | null;
}

export function ActiveWorkoutLogger({
  workout,
  lastReference,
}: ActiveWorkoutLoggerProps) {
  const isActive = !workout.completed_at;

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
    <div className="space-y-4 pb-24">
      {exercises.map((exercise, index) => (
        <ExerciseCard
          key={exercise.id}
          exercise={exercise}
          workoutId={workout.id}
          isActive={isActive}
          isFirst={index === 0}
          isLast={index === exercises.length - 1}
          allExerciseIds={exerciseIds}
          previousSets={getPreviousSets(exercise.exercise_name)}
        />
      ))}

      {exercises.length === 0 && isActive && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Add your first exercise to start logging sets.
        </p>
      )}

      {isActive && (
        <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-lg gap-2 px-4">
          <AddExerciseSheet workoutId={workout.id} workoutSplit={workout.split} />
          <CompleteWorkoutSheet workoutId={workout.id} />
        </div>
      )}
    </div>
  );
}
