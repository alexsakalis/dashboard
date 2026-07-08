import type {
  ExercisePersonalRecord,
  ProgressTrend,
  RecordType,
  Workout,
  WorkoutSet,
} from "@/types/gym";
import {
  bestEstimated1RM,
  estimate1RM,
  setVolume,
} from "@/lib/gym/calculations";
import { startOfWeek, format, parseISO, isSameWeek } from "date-fns";

export function computeTrend(values: number[]): ProgressTrend {
  if (values.length < 2) return "flat";
  const recent = values.slice(-3);
  const earlier = values.slice(-6, -3);
  if (recent.length === 0 || earlier.length === 0) return "flat";

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length;
  const diff = recentAvg - earlierAvg;
  const threshold = earlierAvg * 0.02;

  if (diff > threshold) return "improving";
  if (diff < -threshold) return "declining";
  return "flat";
}

export function weeklyWorkoutCount(
  workouts: Workout[],
  referenceDate = new Date(),
): number {
  return workouts.filter((w) => {
    if (!w.completed_at) return false;
    return isSameWeek(parseISO(w.completed_at), referenceDate, {
      weekStartsOn: 1,
    });
  }).length;
}

export function trainingStreak(workouts: Workout[]): number {
  const completedDates = [
    ...new Set(
      workouts
        .filter((w) => w.completed_at)
        .map((w) => format(parseISO(w.completed_at!), "yyyy-MM-dd")),
    ),
  ].sort((a, b) => b.localeCompare(a));

  if (completedDates.length === 0) return 0;

  let streak = 0;
  const today = format(new Date(), "yyyy-MM-dd");
  let checkDate = today;

  const dateSet = new Set(completedDates);
  if (!dateSet.has(checkDate)) {
    const yesterday = format(
      new Date(Date.now() - 86400000),
      "yyyy-MM-dd",
    );
    if (!dateSet.has(yesterday)) return 0;
    checkDate = yesterday;
  }

  while (dateSet.has(checkDate)) {
    streak++;
    const d = parseISO(checkDate);
    d.setDate(d.getDate() - 1);
    checkDate = format(d, "yyyy-MM-dd");
  }

  return streak;
}

export interface DetectedPR {
  exercise_name: string;
  record_type: RecordType;
  value: number;
  reps: number | null;
  weight: number | null;
  set_id: string;
}

export function detectPRsFromSets(
  sets: WorkoutSet[],
  existingPRs: ExercisePersonalRecord[],
): DetectedPR[] {
  const detected: DetectedPR[] = [];
  const byExercise = new Map<string, WorkoutSet[]>();

  for (const set of sets.filter((s) => !s.is_warmup)) {
    const list = byExercise.get(set.exercise_name) ?? [];
    list.push(set);
    byExercise.set(set.exercise_name, list);
  }

  for (const [exerciseName, exerciseSets] of byExercise) {
    const existing = existingPRs.filter((p) => p.exercise_name === exerciseName);

    for (const set of exerciseSets) {
      if (set.weight == null || set.reps == null) continue;

      const e1rm = estimate1RM(set.weight, set.reps);
      const volume = setVolume(set.reps, set.weight);

      const checks: { type: RecordType; value: number }[] = [
        { type: "max_weight", value: set.weight },
        { type: "max_reps", value: set.reps },
        { type: "estimated_1rm", value: e1rm },
        { type: "max_volume_set", value: volume },
      ];

      for (const { type, value } of checks) {
        const prev = existing.find((p) => p.record_type === type);
        if (!prev || value > prev.value) {
          detected.push({
            exercise_name: exerciseName,
            record_type: type,
            value,
            reps: set.reps,
            weight: set.weight,
            set_id: set.id,
          });
        }
      }
    }
  }

  return detected;
}

export function buildExerciseTimeline(
  workouts: Workout[],
  exerciseName: string,
): { date: string; estimated1RM: number; volume: number }[] {
  return workouts
    .filter((w) => w.completed_at)
    .map((w) => {
      const sets = (w.workout_sets ?? []).filter(
        (s) => s.exercise_name === exerciseName && !s.is_warmup,
      );
      return {
        date: w.completed_at!,
        estimated1RM: bestEstimated1RM(sets),
        volume: sets.reduce((sum, s) => sum + setVolume(s.reps, s.weight), 0),
      };
    })
    .filter((p) => p.estimated1RM > 0 || p.volume > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getWeekStart(date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}
