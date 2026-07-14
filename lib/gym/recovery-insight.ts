import { addDays, format, parseISO } from "date-fns";
import { enrichWorkout } from "@/lib/gym/enrich";
import { formatSplit } from "@/lib/gym/format";
import type { HealthDailySnapshot } from "@/types";
import type { Workout } from "@/types/gym";

export interface WorkoutRecoveryInsight {
  workoutId: string;
  workoutName: string;
  workoutDate: string;
  splitLabel: string | null;
  volume: number;
  readinessDelta: number | null;
  message: string;
}

function snapshotForDate(
  snapshots: HealthDailySnapshot[],
  date: string,
): HealthDailySnapshot | undefined {
  return snapshots.find((s) => s.date === date);
}

export function buildWorkoutRecoveryInsights(
  workouts: Workout[],
  snapshots: HealthDailySnapshot[],
  limit = 6,
): WorkoutRecoveryInsight[] {
  const completed = workouts
    .filter((w) => w.completed_at)
    .slice(0, 30);

  const insights: WorkoutRecoveryInsight[] = [];

  for (const workout of completed) {
    const enriched = enrichWorkout(workout);
    const workoutDate = format(parseISO(workout.completed_at!), "yyyy-MM-dd");
    const nextDate = format(addDays(parseISO(workout.completed_at!), 1), "yyyy-MM-dd");

    const daySnapshot = snapshotForDate(snapshots, workoutDate);
    const nextSnapshot = snapshotForDate(snapshots, nextDate);

    const readinessDay = daySnapshot?.readiness_score ?? null;
    const readinessNext = nextSnapshot?.readiness_score ?? null;
    const delta =
      readinessDay != null && readinessNext != null
        ? readinessNext - readinessDay
        : null;

    const splitLabel = workout.split ? formatSplit(workout.split) : null;
    const volumeLabel = `${Math.round(enriched.totalVolume).toLocaleString()} lb`;

    let message: string;
    if (delta == null) {
      if (readinessNext == null) continue;
      message = `${splitLabel ?? "Workout"} · ${volumeLabel} — readiness ${readinessNext} next day`;
    } else if (delta <= -10) {
      message = `${splitLabel ?? "Session"} · ${volumeLabel} — readiness ${delta} next day (heavy recovery cost)`;
    } else if (delta <= -5) {
      message = `${splitLabel ?? "Session"} · ${volumeLabel} — readiness ${delta} next day`;
    } else if (delta >= 5) {
      message = `${splitLabel ?? "Session"} · ${volumeLabel} — readiness +${delta} next day`;
    } else {
      message = `${splitLabel ?? "Session"} · ${volumeLabel} — readiness held steady`;
    }

    const isNotable =
      delta == null ||
      Math.abs(delta) >= 5 ||
      enriched.totalVolume >= 10000 ||
      workout.split === "legs";

    if (!isNotable) continue;

    insights.push({
      workoutId: workout.id,
      workoutName: workout.name,
      workoutDate,
      splitLabel,
      volume: enriched.totalVolume,
      readinessDelta: delta,
      message,
    });
  }

  return insights.slice(0, limit);
}
