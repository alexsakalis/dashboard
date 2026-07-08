import type {
  BodyWeightLog,
  EnrichedWorkout,
  ExercisePersonalRecord,
  ExerciseProgressSummary,
  GymDashboardSummary,
  LastWorkoutReference,
  ProgressChartPoint,
  Workout,
  WorkoutExercise,
  WorkoutSet,
  WorkoutSplit,
} from "@/types/gym";
import {
  bestEstimated1RM,
  bestWorkingSet,
  countWorkingSets,
  estimate1RM,
  exerciseVolume,
  workoutDuration,
  workoutVolume,
} from "@/lib/gym/calculations";
import { formatDuration } from "@/lib/gym/format";
import {
  buildExerciseTimeline,
  computeTrend,
  trainingStreak,
  weeklyWorkoutCount,
} from "@/lib/gym/progress";
import { suggestNextSplit } from "@/lib/gym/suggestions";

export function flattenSets(workout: Workout): WorkoutSet[] {
  if (workout.workout_exercises?.length) {
    return workout.workout_exercises.flatMap((ex) => ex.workout_sets ?? []);
  }
  return workout.workout_sets ?? [];
}

export function enrichWorkout(workout: Workout): EnrichedWorkout {
  const sets = flattenSets(workout);
  const ended = workout.ended_at ?? workout.completed_at;
  const durationSeconds =
    workout.duration_seconds ??
    (ended ? workoutDuration(workout.started_at, ended) : null);

  return {
    ...workout,
    totalVolume: workoutVolume(sets),
    totalSets: sets.length,
    workingSets: countWorkingSets(sets),
    durationLabel: formatDuration(durationSeconds),
  };
}

export function buildLastWorkoutReference(workout: Workout): LastWorkoutReference {
  const exercises = (workout.workout_exercises ?? []).length
    ? workout.workout_exercises!
    : groupSetsAsExercises(workout.workout_sets ?? []);

  return {
    workoutId: workout.id,
    workoutName: workout.name,
    completedAt: workout.completed_at ?? workout.started_at,
    exercises: exercises.map((ex) => ({
      exerciseName: ex.exercise_name,
      muscleGroup: ex.muscle_group,
      sets: (ex.workout_sets ?? [])
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => ({
          reps: s.reps,
          weight: s.weight,
          isWarmup: s.is_warmup,
        })),
    })),
  };
}

function groupSetsAsExercises(sets: WorkoutSet[]): WorkoutExercise[] {
  const map = new Map<string, WorkoutExercise>();
  for (const set of sets) {
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
  return [...map.values()];
}

export function buildExerciseProgressSummary(
  exerciseName: string,
  workouts: Workout[],
  prs: ExercisePersonalRecord[],
): ExerciseProgressSummary {
  const timeline = buildExerciseTimeline(workouts, exerciseName);
  const allSets = workouts.flatMap((w) =>
    (w.workout_sets ?? []).filter(
      (s) => s.exercise_name === exerciseName && !s.is_warmup,
    ),
  );

  const best = bestWorkingSet(allSets);
  const chartPoints: ProgressChartPoint[] = timeline.map((p) => ({
    date: p.date,
    value: Math.round(p.estimated1RM),
  }));

  return {
    exerciseName,
    bestSet: best
      ? {
          weight: best.weight!,
          reps: best.reps!,
          estimated1RM: Math.round(estimate1RM(best.weight!, best.reps!)),
        }
      : null,
    estimated1RM: best ? Math.round(bestEstimated1RM(allSets)) : null,
    totalVolume: exerciseVolume(allSets),
    trend: computeTrend(timeline.map((p) => p.estimated1RM)),
    recentPR: prs.find((p) => p.exercise_name === exerciseName) ?? null,
    chartPoints,
  };
}

export function buildGymDashboard(input: {
  workouts: Workout[];
  bodyWeight: BodyWeightLog | null;
  recentPRs: ExercisePersonalRecord[];
  topExercises: string[];
  exerciseWorkouts: Map<string, Workout[]>;
  allPRs: ExercisePersonalRecord[];
}): GymDashboardSummary {
  const completed = input.workouts.filter((w) => w.completed_at);
  const lastWorkout = completed[0] ? enrichWorkout(completed[0]) : null;

  const topProgressing = input.topExercises
    .slice(0, 3)
    .map((name) =>
      buildExerciseProgressSummary(
        name,
        input.exerciseWorkouts.get(name) ?? [],
        input.allPRs,
      ),
    )
    .filter((e) => e.estimated1RM != null);

  return {
    lastWorkout,
    suggestedSplit: suggestNextSplit(completed),
    weeklyWorkoutCount: weeklyWorkoutCount(completed),
    trainingStreak: trainingStreak(completed),
    latestBodyWeight: input.bodyWeight,
    recentPRs: input.recentPRs.slice(0, 5),
    topProgressing,
  };
}

export function sortExercises(exercises: WorkoutExercise[]): WorkoutExercise[] {
  return [...exercises].sort((a, b) => a.sort_order - b.sort_order);
}

import { SPLIT_MUSCLE_GROUPS } from "@/lib/gym/constants";

export function getSplitMuscleGroups(split: WorkoutSplit | null): string[] {
  if (!split) return [];
  return SPLIT_MUSCLE_GROUPS[split] ?? [];
}
