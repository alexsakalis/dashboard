import type { Workout, WorkoutSet, WorkoutSplit } from "@/types/gym";
import { SPLIT_MUSCLE_GROUPS } from "@/lib/gym/constants";
import { enrichWorkout } from "@/lib/gym/enrich";
import { workoutVolume } from "@/lib/gym/calculations";
import {
  format,
  parseISO,
  startOfWeek,
  subWeeks,
  eachWeekOfInterval,
} from "date-fns";

export interface WeeklyVolumePoint {
  weekStart: string;
  label: string;
  volume: number;
  workouts: number;
}

export interface MuscleGroupVolume {
  muscleGroup: string;
  sets: number;
  volume: number;
}

export interface GymAnalyticsSummary {
  weeklyVolume: WeeklyVolumePoint[];
  muscleGroups: MuscleGroupVolume[];
  totalVolumeThisWeek: number;
  totalWorkoutsThisWeek: number;
  avgWorkoutDurationMinutes: number | null;
}

function resolveMuscleGroup(
  split: WorkoutSplit | null,
  exerciseMuscleGroup: string | null,
): string {
  if (exerciseMuscleGroup) return exerciseMuscleGroup;
  if (split) {
    const groups = SPLIT_MUSCLE_GROUPS[split];
    if (groups?.length === 1) return groups[0];
  }
  return "other";
}

export function buildGymAnalytics(
  workouts: Workout[],
  weeks = 8,
): GymAnalyticsSummary {
  const completed = workouts
    .filter((w) => w.completed_at)
    .map((w) => enrichWorkout(w));

  const now = new Date();
  const intervalStart = subWeeks(startOfWeek(now, { weekStartsOn: 1 }), weeks - 1);
  const weekStarts = eachWeekOfInterval(
    { start: intervalStart, end: now },
    { weekStartsOn: 1 },
  );

  const weeklyVolume: WeeklyVolumePoint[] = weekStarts.map((weekStart) => {
    const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
    const inWeek = completed.filter((w) => {
      const d = parseISO(w.completed_at!);
      return d >= weekStart && d < weekEnd;
    });

    return {
      weekStart: format(weekStart, "yyyy-MM-dd"),
      label: format(weekStart, "MMM d"),
      volume: inWeek.reduce((sum, w) => sum + w.totalVolume, 0),
      workouts: inWeek.length,
    };
  });

  const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  const thisWeekWorkouts = completed.filter(
    (w) => parseISO(w.completed_at!) >= thisWeekStart,
  );

  const muscleMap = new Map<string, MuscleGroupVolume>();
  for (const workout of thisWeekWorkouts) {
    const exercises = workout.workout_exercises ?? [];
    if (exercises.length > 0) {
      for (const ex of exercises) {
        const group = resolveMuscleGroup(workout.split, ex.muscle_group);
        const sets = (ex.workout_sets ?? []).filter((s) => !s.is_warmup);
        const entry = muscleMap.get(group) ?? {
          muscleGroup: group,
          sets: 0,
          volume: 0,
        };
        entry.sets += sets.length;
        entry.volume += workoutVolume(sets);
        muscleMap.set(group, entry);
      }
      continue;
    }

    const sets = (workout.workout_sets ?? []).filter((s) => !s.is_warmup);
    const byExercise = new Map<string, WorkoutSet[]>();
    for (const set of sets) {
      const list = byExercise.get(set.exercise_name) ?? [];
      list.push(set);
      byExercise.set(set.exercise_name, list);
    }
    for (const [, exerciseSets] of byExercise) {
      const group = resolveMuscleGroup(workout.split, null);
      const entry = muscleMap.get(group) ?? {
        muscleGroup: group,
        sets: 0,
        volume: 0,
      };
      entry.sets += exerciseSets.length;
      entry.volume += workoutVolume(exerciseSets);
      muscleMap.set(group, entry);
    }
  }

  const durations = thisWeekWorkouts
    .map((w) => w.duration_seconds)
    .filter((d): d is number => d != null && d > 0);

  return {
    weeklyVolume,
    muscleGroups: [...muscleMap.values()].sort((a, b) => b.volume - a.volume),
    totalVolumeThisWeek: thisWeekWorkouts.reduce((sum, w) => sum + w.totalVolume, 0),
    totalWorkoutsThisWeek: thisWeekWorkouts.length,
    avgWorkoutDurationMinutes:
      durations.length > 0
        ? Math.round(
            durations.reduce((a, b) => a + b, 0) / durations.length / 60,
          )
        : null,
  };
}
