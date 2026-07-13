"use server";

import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import {
  calculateStreakBonus,
  getTaskPoints,
  RECURRING_BONUS_POINTS,
} from "@/lib/scoring/daily-score";
import type { TaskPriority } from "@/types";

async function syncDailyScoreFromEvents(userId: string, date: string) {
  const supabase = await createClient();

  const { data: events, error: eventsError } = await supabase
    .from("score_events")
    .select("event_type, points")
    .eq("user_id", userId)
    .eq("date", date);

  if (eventsError) throw eventsError;

  const totals = (events ?? []).reduce(
    (acc, event) => {
      const points = event.points ?? 0;
      acc.total_score += points;

      if (
        event.event_type === "task_complete" ||
        event.event_type === "recurring_bonus"
      ) {
        acc.task_points += points;
        acc.tasks_completed += 1;
      } else if (event.event_type === "habit_complete") {
        acc.habit_points += points;
        acc.habits_completed += 1;
      } else if (event.event_type === "streak_bonus") {
        acc.streak_bonus += points;
      }

      return acc;
    },
    {
      task_points: 0,
      habit_points: 0,
      streak_bonus: 0,
      total_score: 0,
      tasks_completed: 0,
      habits_completed: 0,
    },
  );

  const { error } = await supabase.from("daily_scores").upsert(
    {
      user_id: userId,
      date,
      ...totals,
    },
    { onConflict: "user_id,date" },
  );

  if (error) throw error;
}

export async function awardTaskPoints(
  userId: string,
  taskId: string,
  priority: TaskPriority,
  hasRecurrence: boolean,
) {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const points =
    getTaskPoints(priority) + (hasRecurrence ? RECURRING_BONUS_POINTS : 0);

  const { error: eventError } = await supabase.from("score_events").insert({
    user_id: userId,
    date: today,
    event_type: hasRecurrence ? "recurring_bonus" : "task_complete",
    reference_id: taskId,
    points,
  });

  if (eventError) throw eventError;

  await syncDailyScoreFromEvents(userId, today);

  const { error: taskError } = await supabase
    .from("tasks")
    .update({ points_awarded: points })
    .eq("id", taskId);

  if (taskError) throw taskError;

  return points;
}

export async function awardHabitPoints(
  userId: string,
  habitId: string,
  pointsPerCompletion: number,
  streakDays: number,
) {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const streakBonus = calculateStreakBonus(streakDays);
  const totalPoints = pointsPerCompletion + streakBonus;

  const { error: eventError } = await supabase.from("score_events").insert([
    {
      user_id: userId,
      date: today,
      event_type: "habit_complete",
      reference_id: habitId,
      points: pointsPerCompletion,
    },
    ...(streakBonus > 0
      ? [
          {
            user_id: userId,
            date: today,
            event_type: "streak_bonus",
            reference_id: habitId,
            points: streakBonus,
          },
        ]
      : []),
  ]);

  if (eventError) throw eventError;

  await syncDailyScoreFromEvents(userId, today);

  return totalPoints;
}

export async function revokeHabitPoints(userId: string, habitId: string) {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: events, error: fetchError } = await supabase
    .from("score_events")
    .select("id")
    .eq("user_id", userId)
    .eq("date", today)
    .eq("reference_id", habitId)
    .in("event_type", ["habit_complete", "streak_bonus"]);

  if (fetchError) throw fetchError;
  if (!events?.length) {
    await syncDailyScoreFromEvents(userId, today);
    return;
  }

  const { error: deleteError } = await supabase
    .from("score_events")
    .delete()
    .in(
      "id",
      events.map((event) => event.id),
    );

  if (deleteError) throw deleteError;

  await syncDailyScoreFromEvents(userId, today);
}

export async function getTodayScore(userId: string) {
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data } = await supabase
    .from("daily_scores")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  return (
    data ?? {
      task_points: 0,
      habit_points: 0,
      streak_bonus: 0,
      total_score: 0,
      tasks_completed: 0,
      habits_completed: 0,
    }
  );
}

export async function calculateHabitStreak(
  userId: string,
  habitId: string,
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("habit_completions")
    .select("completed_date")
    .eq("user_id", userId)
    .eq("habit_id", habitId)
    .order("completed_date", { ascending: false })
    .limit(30);

  if (!data?.length) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < data.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = format(expected, "yyyy-MM-dd");

    if (data[i].completed_date === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
