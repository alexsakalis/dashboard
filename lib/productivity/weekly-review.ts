import { format, startOfWeek, subDays } from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface WeeklyReview {
  weekStart: string;
  weekEnd: string;
  tasksCompleted: number;
  habitsCompleted: number;
  habitCompletionRate: number | null;
  gymSessions: number;
  avgSleep: number | null;
  avgReadiness: number | null;
  avgDailyScore: number | null;
  journalEntries: number;
  highlights: string[];
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export async function buildWeeklyReview(
  supabase: SupabaseClient,
  userId: string,
  referenceDate = new Date(),
): Promise<WeeklyReview> {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 });
  const weekEnd = subDays(weekStart, -6);
  const weekStartStr = format(weekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");

  const [
    scoresRes,
    workoutsRes,
    healthRes,
    journalRes,
    habitsRes,
  ] = await Promise.all([
    supabase
      .from("daily_scores")
      .select("tasks_completed, habits_completed, total_score")
      .eq("user_id", userId)
      .gte("date", weekStartStr)
      .lte("date", weekEndStr),
    supabase
      .from("workouts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("completed_at", `${weekStartStr}T00:00:00`)
      .lte("completed_at", `${weekEndStr}T23:59:59`),
    supabase
      .from("health_daily_snapshots")
      .select("sleep_score, readiness_score")
      .eq("user_id", userId)
      .gte("date", weekStartStr)
      .lte("date", weekEndStr),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("note_type", "journal")
      .gte("title", weekStartStr)
      .lte("title", weekEndStr),
    supabase
      .from("habits")
      .select("id")
      .eq("user_id", userId)
      .eq("active", true),
  ]);

  const scores = scoresRes.data ?? [];
  const tasksCompleted = scores.reduce(
    (sum, row) => sum + (row.tasks_completed ?? 0),
    0,
  );
  const habitsCompleted = scores.reduce(
    (sum, row) => sum + (row.habits_completed ?? 0),
    0,
  );
  const activeHabits = habitsRes.data?.length ?? 0;
  const habitSlots = activeHabits * 7;
  const habitCompletionRate =
    habitSlots > 0 ? Math.round((habitsCompleted / habitSlots) * 100) : null;

  const health = healthRes.data ?? [];
  const avgSleep = average(
    health
      .map((row) => row.sleep_score)
      .filter((value): value is number => value != null),
  );
  const avgReadiness = average(
    health
      .map((row) => row.readiness_score)
      .filter((value): value is number => value != null),
  );
  const avgDailyScore = average(
    scores
      .map((row) => row.total_score)
      .filter((value): value is number => value != null),
  );

  const highlights: string[] = [];
  if (tasksCompleted > 0) {
    highlights.push(`${tasksCompleted} task${tasksCompleted === 1 ? "" : "s"} completed`);
  }
  if (habitCompletionRate != null && habitCompletionRate >= 70) {
    highlights.push(`${habitCompletionRate}% habit consistency`);
  }
  if ((workoutsRes.count ?? 0) > 0) {
    highlights.push(
      `${workoutsRes.count} gym session${workoutsRes.count === 1 ? "" : "s"}`,
    );
  }
  if (avgReadiness != null && avgReadiness >= 75) {
    highlights.push(`Avg readiness ${avgReadiness}`);
  }
  if (avgSleep != null && avgSleep >= 80) {
    highlights.push(`Avg sleep score ${avgSleep}`);
  }
  if ((journalRes.count ?? 0) > 0) {
    highlights.push(
      `${journalRes.count} journal entr${journalRes.count === 1 ? "y" : "ies"}`,
    );
  }
  if (highlights.length === 0) {
    highlights.push("Light week — fresh start ahead.");
  }

  return {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    tasksCompleted,
    habitsCompleted,
    habitCompletionRate,
    gymSessions: workoutsRes.count ?? 0,
    avgSleep,
    avgReadiness,
    avgDailyScore,
    journalEntries: journalRes.count ?? 0,
    highlights,
  };
}
