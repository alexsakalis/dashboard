import type { CombinedHealthMetrics, HealthDailySnapshot } from "@/types";

export function mergeHealthMetrics(
  snapshots: HealthDailySnapshot[],
  date: string,
): CombinedHealthMetrics {
  const oura = snapshots.find((s) => s.date === date && s.source === "oura");

  return {
    date,
    sleep_score: oura?.sleep_score ?? null,
    sleep_duration_min: oura?.sleep_duration_min ?? null,
    readiness_score: oura?.readiness_score ?? null,
    hrv_ms: oura?.hrv_ms ?? null,
    resting_hr: oura?.resting_hr ?? null,
    steps: oura?.steps ?? null,
    active_calories: oura?.active_calories ?? null,
    workout_count: oura?.workout_count ?? null,
  };
}
