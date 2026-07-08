import type { PostgrestError } from "@supabase/supabase-js";
import type { Workout, WorkoutExercise, WorkoutSet } from "@/types/gym";

export const LEGACY_WORKOUT_SELECT = "*, workout_sets(*)";
export const FULL_WORKOUT_SELECT = `
  *,
  workout_exercises(
    *,
    workout_sets(*)
  ),
  workout_sets(*)
`;

export function isMissingSchemaError(error: PostgrestError | null): boolean {
  if (!error) return false;
  return (
    error.code === "PGRST200" ||
    error.code === "PGRST205" ||
    error.code === "42703" ||
    error.message.includes("schema cache") ||
    error.message.includes("does not exist")
  );
}

export function hydrateWorkoutFromLegacySets(workout: Workout): Workout {
  if (!workout.split && workout.workout_type) {
    workout.split = workout.workout_type as Workout["split"];
  }

  if (workout.workout_exercises?.length) {
    return workout;
  }

  if (!workout.workout_sets?.length) {
    workout.workout_exercises = [];
    return workout;
  }

  const map = new Map<string, WorkoutExercise>();
  const sortedSets = [...workout.workout_sets].sort(
    (a, b) => a.set_number - b.set_number,
  );

  for (const set of sortedSets) {
    if (!map.has(set.exercise_name)) {
      map.set(set.exercise_name, {
        id: set.workout_exercise_id ?? set.id,
        user_id: set.user_id,
        workout_id: set.workout_id,
        exercise_library_id: null,
        exercise_name: set.exercise_name,
        muscle_group: null,
        sort_order: map.size,
        notes: null,
        created_at: set.created_at,
        workout_sets: [],
      });
    }
    map.get(set.exercise_name)!.workout_sets!.push(set);
  }

  workout.workout_exercises = [...map.values()];
  return workout;
}

export function attachSetsToExercises(workout: Workout): Workout {
  if (!workout.workout_exercises?.length || !workout.workout_sets?.length) {
    return workout;
  }

  const setsByExerciseId = new Map<string, WorkoutSet[]>();
  for (const set of workout.workout_sets) {
    if (!set.workout_exercise_id) continue;
    const list = setsByExerciseId.get(set.workout_exercise_id) ?? [];
    list.push(set);
    setsByExerciseId.set(set.workout_exercise_id, list);
  }

  for (const exercise of workout.workout_exercises) {
    if (!exercise.workout_sets?.length) {
      exercise.workout_sets = setsByExerciseId.get(exercise.id) ?? [];
    }
  }

  return workout;
}

export function normalizeWorkout(workout: Workout): Workout {
  const hydrated = hydrateWorkoutFromLegacySets(workout);
  return attachSetsToExercises(hydrated);
}
