import type { WorkoutSet } from "@/types/gym";

export function estimate1RM(weight: number, reps: number): number {
  if (reps <= 0 || weight <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

export function setVolume(reps: number | null, weight: number | null): number {
  if (reps == null || weight == null || reps <= 0 || weight <= 0) return 0;
  return reps * weight;
}

export function exerciseVolume(sets: WorkoutSet[]): number {
  return sets
    .filter((s) => !s.is_warmup)
    .reduce((sum, s) => sum + setVolume(s.reps, s.weight), 0);
}

export function workoutVolume(sets: WorkoutSet[]): number {
  return exerciseVolume(sets);
}

export function workoutDuration(
  startedAt: string,
  endedAt: string | null,
): number | null {
  if (!endedAt) return null;
  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  if (end <= start) return null;
  return Math.round((end - start) / 1000);
}

export function bestWorkingSet(sets: WorkoutSet[]): WorkoutSet | null {
  const working = sets.filter(
    (s) => !s.is_warmup && s.weight != null && s.reps != null && s.reps > 0,
  );
  if (working.length === 0) return null;

  return working.reduce((best, current) => {
    const best1RM = estimate1RM(best.weight!, best.reps!);
    const current1RM = estimate1RM(current.weight!, current.reps!);
    return current1RM > best1RM ? current : best;
  });
}

export function bestEstimated1RM(sets: WorkoutSet[]): number {
  const best = bestWorkingSet(sets);
  if (!best || best.weight == null || best.reps == null) return 0;
  return estimate1RM(best.weight, best.reps);
}

export function countWorkingSets(sets: WorkoutSet[]): number {
  return sets.filter((s) => !s.is_warmup).length;
}
