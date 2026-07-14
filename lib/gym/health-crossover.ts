import { differenceInCalendarDays, parseISO } from "date-fns";
import { SPLIT_LABELS } from "@/lib/gym/constants";
import { summarizeHealthTrends } from "@/lib/health/trends";
import type { HealthDailySnapshot } from "@/types";
import type { WorkoutSplit } from "@/types/gym";

export type GymTrainingIntensity = "heavy" | "moderate" | "light" | "rest";

export type GymHealthLevel = "optimal" | "good" | "caution" | "recovery" | "unavailable";

export interface GymHealthContext {
  suggestedSplit: WorkoutSplit;
  weeklyWorkouts: number;
  lastWorkoutDate: string | null;
}

export interface GymHealthInsight {
  level: GymHealthLevel;
  intensity: GymTrainingIntensity;
  headline: string;
  detail: string;
  splitLabel: string;
  hrvChangePct: number | null;
  readiness: number | null;
}

function trainedYesterday(lastWorkoutDate: string | null): boolean {
  if (!lastWorkoutDate) return false;
  return (
    differenceInCalendarDays(new Date(), parseISO(`${lastWorkoutDate}T12:00:00`)) <=
    1
  );
}

function hrvChangePercent(
  current: number | null,
  average7d: number | null,
): number | null {
  if (current == null || average7d == null || average7d === 0) return null;
  return Math.round(((current - average7d) / average7d) * 100);
}

function splitTrainingNote(split: WorkoutSplit, intensity: GymTrainingIntensity): string {
  const label = SPLIT_LABELS[split].toLowerCase();
  if (intensity === "heavy" && split === "legs") {
    return "Readiness supports heavy squats and hinges.";
  }
  if (intensity === "heavy") {
    return `Good day to push ${label} with full working weights.`;
  }
  if (intensity === "moderate") {
    return `${SPLIT_LABELS[split]} is fine — stay at normal volume.`;
  }
  if (intensity === "light") {
    return `If you train ${label}, cut volume ~30% and skip max attempts.`;
  }
  return "Prioritize walking, mobility, and sleep over training load.";
}

export function buildGymHealthInsight(
  snapshots: HealthDailySnapshot[],
  context: GymHealthContext,
  readiness: number | null,
  hrv: number | null,
): GymHealthInsight {
  const splitLabel = SPLIT_LABELS[context.suggestedSplit];
  const trend7d = summarizeHealthTrends(snapshots, 7);
  const avgHrv7d = trend7d.averages.hrv_ms;
  const hrvDelta = hrvChangePercent(hrv, avgHrv7d);
  const recentTraining =
    trainedYesterday(context.lastWorkoutDate) || context.weeklyWorkouts >= 4;

  if (readiness == null && hrv == null) {
    return {
      level: "unavailable",
      intensity: "moderate",
      headline: "Connect Oura for recovery-aware training tips",
      detail: `Suggested split: ${splitLabel}.`,
      splitLabel,
      hrvChangePct: null,
      readiness: null,
    };
  }

  let intensity: GymTrainingIntensity = "moderate";
  let level: GymHealthLevel = "good";

  if (readiness != null) {
    if (readiness >= 85) {
      intensity = "heavy";
      level = "optimal";
    } else if (readiness >= 70) {
      intensity = "moderate";
      level = "good";
    } else if (readiness >= 50) {
      intensity = "light";
      level = "caution";
    } else {
      intensity = "rest";
      level = "recovery";
    }
  }

  if (hrvDelta != null && hrvDelta <= -15) {
    intensity =
      intensity === "heavy" || intensity === "moderate" ? "light" : "rest";
    level = level === "optimal" || level === "good" ? "caution" : "recovery";
  }

  if (recentTraining && readiness != null && readiness < 65) {
    intensity = "rest";
    level = "recovery";
  }

  if (context.weeklyWorkouts >= 5) {
    intensity = "rest";
    level = "recovery";
  }

  let headline: string;
  let detail: string;

  if (level === "optimal") {
    headline =
      readiness != null
        ? `Readiness ${readiness} — strong day for ${splitLabel}`
        : `Recovery looks solid — ${splitLabel} day`;
    detail = splitTrainingNote(context.suggestedSplit, intensity);
    if (hrvDelta != null && hrvDelta >= 10) {
      detail = `HRV +${hrvDelta}% vs 7-day avg. ${detail}`;
    }
  } else if (level === "good") {
    headline =
      readiness != null
        ? `Readiness ${readiness} — ${splitLabel} at normal intensity`
        : `${splitLabel} at normal intensity`;
    detail = splitTrainingNote(context.suggestedSplit, intensity);
  } else if (level === "caution") {
    if (hrvDelta != null && hrvDelta <= -15) {
      headline = `HRV down ${Math.abs(hrvDelta)}% — ease off today`;
      detail =
        readiness != null
          ? `Readiness ${readiness}. Consider deload sets or swap to mobility.`
          : "Consider deload sets or mobility work instead of max effort.";
    } else {
      headline =
        readiness != null
          ? `Readiness ${readiness} — keep ${splitLabel} lighter`
          : `Keep ${splitLabel} lighter today`;
      detail = splitTrainingNote(context.suggestedSplit, intensity);
    }
  } else {
    headline =
      context.weeklyWorkouts >= 5
        ? `${context.weeklyWorkouts} sessions this week — recovery day`
        : readiness != null
          ? `Readiness ${readiness} — recovery over intensity`
          : "Recovery over intensity today";
    detail =
      intensity === "rest"
        ? splitTrainingNote(context.suggestedSplit, intensity)
        : splitTrainingNote(context.suggestedSplit, intensity);
    if (trainedYesterday(context.lastWorkoutDate)) {
      detail = `You trained recently. ${detail}`;
    }
  }

  return {
    level,
    intensity,
    headline,
    detail,
    splitLabel,
    hrvChangePct: hrvDelta,
    readiness,
  };
}
