import type {
  ProgressionHint,
  ProgressionStatus,
  Workout,
  WorkoutSet,
  WorkoutSplit,
} from "@/types/gym";
import { WORKOUT_SPLITS } from "@/lib/gym/constants";
import { WEIGHT_INCREMENT_LBS } from "@/lib/gym/constants";

const SPLIT_NAME_PATTERNS: Record<WorkoutSplit, RegExp[]> = {
  push: [/push/i, /chest/i, /shoulder/i, /tricep/i],
  pull: [/pull/i, /back/i, /bicep/i, /lat/i],
  legs: [/leg/i, /squat/i, /deadlift/i, /glute/i, /hamstring/i],
  upper: [/upper/i],
  lower: [/lower/i],
  full_body: [/full\s*body/i, /total\s*body/i],
  custom: [],
};

export function matchSplitFromName(name: string): WorkoutSplit | null {
  const normalized = name.trim();
  for (const split of WORKOUT_SPLITS) {
    if (split === "custom") continue;
    if (SPLIT_NAME_PATTERNS[split].some((re) => re.test(normalized))) {
      return split;
    }
  }
  const lower = normalized.toLowerCase();
  if (WORKOUT_SPLITS.includes(lower as WorkoutSplit)) {
    return lower as WorkoutSplit;
  }
  return null;
}

export function suggestNextSplit(
  recentWorkouts: Workout[],
  preferred: WorkoutSplit[] = ["push", "pull", "legs"],
): WorkoutSplit {
  const rotation = preferred.length > 0 ? preferred : (["push", "pull", "legs"] as WorkoutSplit[]);
  const completed = recentWorkouts.filter((w) => w.completed_at && w.split);

  if (completed.length === 0) return rotation[0];

  const lastSplit = completed[0].split as WorkoutSplit;
  const lastIndex = rotation.indexOf(lastSplit);
  if (lastIndex >= 0) {
    return rotation[(lastIndex + 1) % rotation.length];
  }
  return rotation[0];
}

export function suggestProgression(
  exerciseName: string,
  lastSets: WorkoutSet[],
  todaySets: WorkoutSet[],
): ProgressionHint {
  const lastWorking = lastSets.filter((s) => !s.is_warmup);
  const todayWorking = todaySets.filter((s) => !s.is_warmup);

  const lastSummary = lastWorking.map((s) => ({
    reps: s.reps,
    weight: s.weight,
  }));

  if (lastWorking.length === 0) {
    return {
      exerciseName,
      status: "new",
      suggestedWeight: null,
      lastSets: [],
      message: "First time logging this exercise",
    };
  }

  if (todayWorking.length === 0) {
    const topSet = lastWorking[lastWorking.length - 1];
    return {
      exerciseName,
      status: "stalled",
      suggestedWeight: topSet.weight,
      lastSets: lastSummary,
      message: `Last time: ${topSet.weight} × ${topSet.reps}`,
    };
  }

  const targetReps = lastWorking.map((s) => s.reps ?? 0);
  const hitAllTargets = todayWorking.every((s, i) => {
    const target = targetReps[i] ?? targetReps[targetReps.length - 1];
    return (s.reps ?? 0) >= target;
  });

  const lastTopWeight = Math.max(...lastWorking.map((s) => s.weight ?? 0));
  const todayTopWeight = Math.max(...todayWorking.map((s) => s.weight ?? 0));

  if (todayTopWeight > lastTopWeight) {
    return {
      exerciseName,
      status: "improved",
      suggestedWeight: todayTopWeight + WEIGHT_INCREMENT_LBS,
      lastSets: lastSummary,
      message: "Weight increased — great progress!",
    };
  }

  if (hitAllTargets) {
    return {
      exerciseName,
      status: "improved",
      suggestedWeight: lastTopWeight + WEIGHT_INCREMENT_LBS,
      lastSets: lastSummary,
      message: `Try ${lastTopWeight + WEIGHT_INCREMENT_LBS} lbs next time`,
    };
  }

  return {
    exerciseName,
    status: "stalled",
    suggestedWeight: lastTopWeight,
    lastSets: lastSummary,
    message: `Hold at ${lastTopWeight} lbs until all reps hit`,
  };
}

export function getProgressionStatus(
  lastSets: WorkoutSet[],
  todaySets: WorkoutSet[],
): ProgressionStatus {
  return suggestProgression("", lastSets, todaySets).status;
}
