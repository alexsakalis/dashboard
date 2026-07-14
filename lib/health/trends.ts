import { format, subDays } from "date-fns";
import { mergeHealthMetrics } from "@/lib/integrations/health-metrics";
import type { CombinedHealthMetrics, HealthDailySnapshot } from "@/types";
import type { ProgressChartPoint } from "@/types/gym";

export type HealthMetricKey =
  | "sleep_score"
  | "readiness_score"
  | "hrv_ms"
  | "steps"
  | "activity_score"
  | "resting_hr";

export interface RecoveryHint {
  level: "high" | "moderate" | "low" | "neutral";
  message: string;
}

export interface HealthTrendSummary {
  days: number;
  averages: {
    sleep_score: number | null;
    readiness_score: number | null;
    hrv_ms: number | null;
    steps: number | null;
    activity_score: number | null;
  };
  deltas: {
    sleep_score: number | null;
    readiness_score: number | null;
  };
}

function uniqueDates(snapshots: HealthDailySnapshot[]): string[] {
  return [...new Set(snapshots.map((snapshot) => snapshot.date))].sort();
}

export function buildHealthMetricsSeries(
  snapshots: HealthDailySnapshot[],
  days: number,
): CombinedHealthMetrics[] {
  const cutoff = format(subDays(new Date(), days - 1), "yyyy-MM-dd");
  return uniqueDates(snapshots)
    .filter((date) => date >= cutoff)
    .map((date) => mergeHealthMetrics(snapshots, date));
}

function average(
  values: Array<number | null | undefined>,
): number | null {
  const nums = values.filter((value): value is number => value != null);
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((sum, value) => sum + value, 0) / nums.length);
}

export function summarizeHealthTrends(
  snapshots: HealthDailySnapshot[],
  days: number,
): HealthTrendSummary {
  const series = buildHealthMetricsSeries(snapshots, days);
  const midpoint = Math.floor(series.length / 2);
  const recentHalf = series.slice(midpoint);
  const earlierHalf = series.slice(0, midpoint);

  const avgSleepRecent = average(recentHalf.map((row) => row.sleep_score));
  const avgSleepEarlier = average(earlierHalf.map((row) => row.sleep_score));
  const avgReadinessRecent = average(
    recentHalf.map((row) => row.readiness_score),
  );
  const avgReadinessEarlier = average(
    earlierHalf.map((row) => row.readiness_score),
  );

  return {
    days,
    averages: {
      sleep_score: average(series.map((row) => row.sleep_score)),
      readiness_score: average(series.map((row) => row.readiness_score)),
      hrv_ms: average(series.map((row) => row.hrv_ms)),
      steps: average(series.map((row) => row.steps)),
      activity_score: average(series.map((row) => row.activity_score)),
    },
    deltas: {
      sleep_score:
        avgSleepRecent != null && avgSleepEarlier != null
          ? avgSleepRecent - avgSleepEarlier
          : null,
      readiness_score:
        avgReadinessRecent != null && avgReadinessEarlier != null
          ? avgReadinessRecent - avgReadinessEarlier
          : null,
    },
  };
}

export function toHealthSparklinePoints(
  series: CombinedHealthMetrics[],
  key: HealthMetricKey,
): ProgressChartPoint[] {
  return series
    .filter((row) => row[key] != null)
    .map((row) => ({
      date: row.date,
      value: Number(row[key]),
    }));
}

export function buildRecoveryHint(
  readiness: number | null,
  sleep: number | null,
  avgReadiness7d: number | null = null,
): RecoveryHint {
  if (readiness != null) {
    const trend =
      avgReadiness7d != null && readiness - avgReadiness7d >= 8
        ? " Trending up this week."
        : avgReadiness7d != null && avgReadiness7d - readiness >= 8
          ? " Below your 7-day average."
          : "";

    if (readiness >= 85) {
      return {
        level: "high",
        message: `Well recovered (${readiness}) — good day for training and deep work.${trend}`,
      };
    }
    if (readiness >= 70) {
      return {
        level: "moderate",
        message: `Decent recovery (${readiness}). Focus on priorities.${trend}`,
      };
    }
    if (readiness >= 50) {
      return {
        level: "moderate",
        message: `Moderate recovery (${readiness}) — keep today simple.${trend}`,
      };
    }
    return {
      level: "low",
      message: `Low readiness (${readiness}). Favor rest and essentials.${trend}`,
    };
  }

  if (sleep != null) {
    if (sleep >= 80) {
      return {
        level: "high",
        message: `Solid sleep (${sleep}). You're set up well for today.`,
      };
    }
    if (sleep >= 65) {
      return {
        level: "moderate",
        message: `Sleep was okay (${sleep}) — pace yourself.`,
      };
    }
    return {
      level: "low",
      message: `Sleep below average (${sleep}). Protect your energy today.`,
    };
  }

  return {
    level: "neutral",
    message: "Connect Oura to get recovery insights.",
  };
}

export function buildSleepReadinessInsight(
  series: CombinedHealthMetrics[],
): string | null {
  const pairs = series.filter(
    (row) => row.sleep_score != null && row.readiness_score != null,
  );

  if (pairs.length < 4) return null;

  const goodSleep = pairs.filter((row) => (row.sleep_score ?? 0) >= 80);
  const poorSleep = pairs.filter((row) => (row.sleep_score ?? 0) < 70);

  if (goodSleep.length >= 2 && poorSleep.length >= 2) {
    const goodAvg = average(goodSleep.map((row) => row.readiness_score));
    const poorAvg = average(poorSleep.map((row) => row.readiness_score));

    if (goodAvg != null && poorAvg != null && goodAvg - poorAvg >= 8) {
      return `When sleep is 80+, readiness averages ${goodAvg} vs ${poorAvg} after rough nights.`;
    }
  }

  const latest = pairs[pairs.length - 1];
  if (
    latest.sleep_score != null &&
    latest.readiness_score != null &&
    latest.sleep_score >= 75 &&
    latest.readiness_score < 60
  ) {
    return "Sleep looked fine but readiness is low — stress or training load may be the factor.";
  }

  return null;
}

export function formatTrendDelta(delta: number | null, label: string): string | null {
  if (delta == null || delta === 0) return null;
  const sign = delta > 0 ? "+" : "";
  return `${label} ${sign}${delta} vs prior half of period`;
}
