import type { TaskPriority } from "@/types";

export const DAILY_SCORE_GOAL = 100;

export const TASK_POINTS: Record<TaskPriority, number> = {
  low: 5,
  medium: 10,
  high: 15,
  urgent: 20,
};

export const STREAK_BONUS_THRESHOLD = 7;
export const STREAK_BONUS_POINTS = 10;
export const RECURRING_BONUS_POINTS = 3;

export function getTaskPoints(priority: TaskPriority): number {
  return TASK_POINTS[priority];
}

export function calculateStreakBonus(streakDays: number): number {
  if (streakDays >= STREAK_BONUS_THRESHOLD && streakDays % STREAK_BONUS_THRESHOLD === 0) {
    return STREAK_BONUS_POINTS;
  }
  return 0;
}

export function calculateDailyProgress(totalScore: number): number {
  return Math.min(100, Math.round((totalScore / DAILY_SCORE_GOAL) * 100));
}
