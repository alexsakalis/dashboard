import { calculateDailyProgress, DAILY_SCORE_GOAL } from "@/lib/scoring/daily-score";
import type { DashboardSummary } from "@/types";

export interface SmartScoreComponent {
  label: string;
  points: number;
  description: string;
}

export interface SmartScoreBreakdown {
  baseScore: number;
  wellnessBonus: number;
  enhancedTotal: number;
  progress: number;
  goal: number;
  components: SmartScoreComponent[];
}

function readinessBonus(readiness: number | null): SmartScoreComponent | null {
  if (readiness == null) return null;
  if (readiness >= 85) {
    return {
      label: "Recovery",
      points: 8,
      description: `Readiness ${readiness} — well recovered`,
    };
  }
  if (readiness >= 70) {
    return {
      label: "Recovery",
      points: 4,
      description: `Readiness ${readiness} — decent recovery`,
    };
  }
  if (readiness < 50) {
    return {
      label: "Recovery",
      points: -3,
      description: `Readiness ${readiness} — prioritize rest`,
    };
  }
  return null;
}

function sleepBonus(sleep: number | null): SmartScoreComponent | null {
  if (sleep == null) return null;
  if (sleep >= 80) {
    return {
      label: "Sleep",
      points: 5,
      description: `Sleep score ${sleep}`,
    };
  }
  if (sleep < 65) {
    return {
      label: "Sleep",
      points: -2,
      description: `Sleep score ${sleep} — below average`,
    };
  }
  return null;
}

export function buildSmartScoreBreakdown(
  summary: DashboardSummary,
): SmartScoreBreakdown {
  const detail = summary.card_data.daily_score_detail;
  const habits = summary.card_data.habits_preview;
  const baseScore = detail.total_score;

  const wellnessComponents = [
    readinessBonus(summary.readiness_score),
    sleepBonus(summary.sleep_score),
    summary.card_data.gym_last_workout &&
    new Date(summary.card_data.gym_last_workout.started_at).toDateString() ===
      new Date().toDateString()
      ? {
          label: "Training",
          points: 6,
          description: "Workout logged today",
        }
      : null,
    habits.length > 0 && habits.every((habit) => habit.completed_today)
      ? {
          label: "Perfect habits",
          points: 5,
          description: "All habits done today",
        }
      : null,
    summary.calendar_events_today >= 4
      ? {
          label: "Calendar load",
          points: -2,
          description: `${summary.calendar_events_today} events today`,
        }
      : null,
  ].filter((item): item is SmartScoreComponent => item != null);

  const wellnessBonus = wellnessComponents.reduce(
    (sum, item) => sum + item.points,
    0,
  );

  const components: SmartScoreComponent[] = [
    {
      label: "Tasks",
      points: detail.task_points,
      description: `${detail.tasks_completed} completed`,
    },
    {
      label: "Habits",
      points: detail.habit_points,
      description: `${detail.habits_completed} completed`,
    },
  ];

  if (detail.streak_bonus > 0) {
    components.push({
      label: "Streak",
      points: detail.streak_bonus,
      description: "Habit streak bonus",
    });
  }

  components.push(...wellnessComponents);

  return {
    baseScore,
    wellnessBonus,
    enhancedTotal: Math.max(0, baseScore + wellnessBonus),
    progress: calculateDailyProgress(Math.max(0, baseScore + wellnessBonus)),
    goal: DAILY_SCORE_GOAL,
    components,
  };
}
