import { format, parseISO } from "date-fns";
import type { CombinedHealthMetrics, HealthDailySnapshot } from "@/types";

interface HealthAutoExportPayload {
  data?: {
    metrics?: Array<{
      name: string;
      data?: Array<{ date?: string; qty?: number; value?: number }>;
    }>;
    workouts?: Array<{
      id?: string;
      name?: string;
      start?: string;
      end?: string;
      duration?: number;
      activeEnergy?: number;
      avgHeartRate?: number;
    }>;
  };
}

function getMetricValue(
  payload: HealthAutoExportPayload,
  metricNames: string[],
  date: string,
): number | null {
  const metrics = payload.data?.metrics ?? [];
  for (const name of metricNames) {
    const metric = metrics.find(
      (m) => m.name.toLowerCase() === name.toLowerCase(),
    );
    if (!metric?.data?.length) continue;

    const point =
      metric.data.find((d) => d.date?.startsWith(date)) ??
      metric.data[metric.data.length - 1];

    const value = point?.qty ?? point?.value;
    if (value !== undefined) return value;
  }
  return null;
}

export function parseHealthAutoExport(
  payload: HealthAutoExportPayload,
  userId: string,
): {
  snapshot: Omit<HealthDailySnapshot, "id" | "synced_at">;
  workouts: Array<{
    user_id: string;
    source: string;
    external_id: string;
    activity_type: string | null;
    start_time: string;
    duration_min: number | null;
    calories: number | null;
    avg_hr: number | null;
    raw_payload: unknown;
  }>;
} {
  const today = format(new Date(), "yyyy-MM-dd");

  const snapshot = {
    user_id: userId,
    date: today,
    source: "apple_health" as const,
    sleep_score: null,
    sleep_duration_min: getMetricValue(payload, ["sleep_analysis", "sleep"], today),
    readiness_score: null,
    hrv_ms: getMetricValue(payload, ["heart_rate_variability", "hrv"], today),
    resting_hr: getMetricValue(
      payload,
      ["resting_heart_rate", "restingHeartRate"],
      today,
    ),
    steps: getMetricValue(payload, ["step_count", "steps"], today),
    active_calories: getMetricValue(
      payload,
      ["active_energy", "activeEnergyBurned"],
      today,
    ),
    workout_count: payload.data?.workouts?.length ?? 0,
    raw_payload: payload,
  };

  const workouts = (payload.data?.workouts ?? []).map((workout, index) => {
    const startTime = workout.start ?? new Date().toISOString();
    let durationMin: number | null = null;
    if (workout.duration) {
      durationMin = Math.round(workout.duration / 60);
    } else if (workout.start && workout.end) {
      durationMin = Math.round(
        (parseISO(workout.end).getTime() - parseISO(workout.start).getTime()) /
          60000,
      );
    }

    return {
      user_id: userId,
      source: "apple_health",
      external_id: workout.id ?? `apple-${startTime}-${index}`,
      activity_type: workout.name ?? null,
      start_time: startTime,
      duration_min: durationMin,
      calories: workout.activeEnergy ?? null,
      avg_hr: workout.avgHeartRate ?? null,
      raw_payload: workout,
    };
  });

  return { snapshot, workouts };
}

export function mergeHealthMetrics(
  snapshots: HealthDailySnapshot[],
  date: string,
): CombinedHealthMetrics {
  const daySnapshots = snapshots.filter((s) => s.date === date);
  const oura = daySnapshots.find((s) => s.source === "oura");
  const apple = daySnapshots.find((s) => s.source === "apple_health");

  return {
    date,
    sleep_score: oura?.sleep_score ?? apple?.sleep_score ?? null,
    sleep_duration_min:
      oura?.sleep_duration_min ?? apple?.sleep_duration_min ?? null,
    readiness_score: oura?.readiness_score ?? null,
    hrv_ms: oura?.hrv_ms ?? apple?.hrv_ms ?? null,
    resting_hr: oura?.resting_hr ?? apple?.resting_hr ?? null,
    steps: apple?.steps ?? oura?.steps ?? null,
    active_calories: apple?.active_calories ?? oura?.active_calories ?? null,
    workout_count:
      (oura?.workout_count ?? 0) + (apple?.workout_count ?? 0),
  };
}
