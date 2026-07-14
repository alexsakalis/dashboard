import { format } from "date-fns";
import { calculateDailyProgress } from "@/lib/scoring/daily-score";
import type { DashboardSummary } from "@/types";

export interface DailyBriefing {
  greeting: string;
  insight: string;
  tasksRemaining: number;
  tasksCompleted: number;
  habitsDone: number;
  habitsTotal: number;
  eventsToday: number;
  score: number;
  scoreProgress: number;
  nextEvent: DashboardSummary["card_data"]["calendar_preview"][number] | null;
  focusTask: DashboardSummary["card_data"]["tasks_preview"][number] | null;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function getRecoveryInsight(summary: DashboardSummary): string {
  const readiness = summary.readiness_score;
  const sleep = summary.sleep_score;

  if (readiness != null) {
    if (readiness >= 85) {
      return "Well recovered — a strong day for deep work and training.";
    }
    if (readiness >= 70) {
      return "Decent recovery. Stay focused on your top priorities.";
    }
    if (readiness >= 50) {
      return "Moderate recovery — keep the plan simple today.";
    }
    return "Low readiness. Favor rest, light movement, and essentials.";
  }

  if (sleep != null) {
    if (sleep >= 80) return "Solid sleep last night. You're set up well for today.";
    if (sleep >= 65) return "Sleep was okay — pace yourself through the day.";
    return "Sleep was below average. Go easy and protect energy.";
  }

  return "Here's your snapshot for today.";
}

const PRIORITY_RANK = { urgent: 0, high: 1, medium: 2, low: 3 } as const;

export function buildDailyBriefing(summary: DashboardSummary): DailyBriefing {
  const habits = summary.card_data.habits_preview;
  const openTasks = summary.card_data.tasks_preview.filter(
    (task) => task.status === "todo",
  );

  const focusTask =
    [...openTasks].sort(
      (a, b) =>
        PRIORITY_RANK[a.priority as keyof typeof PRIORITY_RANK] -
        PRIORITY_RANK[b.priority as keyof typeof PRIORITY_RANK],
    )[0] ?? null;

  const score = summary.card_data.daily_score_detail.total_score;

  return {
    greeting: getGreeting(),
    insight: getRecoveryInsight(summary),
    tasksRemaining: Math.max(
      0,
      summary.tasks_due_today - summary.tasks_completed_today,
    ),
    tasksCompleted: summary.tasks_completed_today,
    habitsDone: habits.filter((habit) => habit.completed_today).length,
    habitsTotal: habits.length,
    eventsToday: summary.calendar_events_today,
    score,
    scoreProgress: calculateDailyProgress(score),
    nextEvent: summary.card_data.calendar_preview[0] ?? null,
    focusTask,
  };
}

export function formatBriefingEventTime(
  startTime: string,
  allDay: boolean,
): string {
  if (allDay) return "All day";
  return format(new Date(startTime), "h:mm a");
}
