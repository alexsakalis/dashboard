"use server";

import { format } from "date-fns";
import { createClient } from "@/lib/supabase/server";
import {
  calculateStreakBonus,
  getTaskPoints,
  RECURRING_BONUS_POINTS,
} from "@/lib/scoring/daily-score";
import type { TaskPriority } from "@/types";

async function getOrCreateDailyScore(userId: string, date: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("daily_scores")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabase
    .from("daily_scores")
    .insert({ user_id: userId, date })
    .select()
    .single();

  if (error) throw error;
  return data;
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

  await supabase.from("score_events").insert({
    user_id: userId,
    date: today,
    event_type: hasRecurrence ? "recurring_bonus" : "task_complete",
    reference_id: taskId,
    points,
  });

  const dailyScore = await getOrCreateDailyScore(userId, today);

  await supabase
    .from("daily_scores")
    .update({
      task_points: dailyScore.task_points + points,
      total_score: dailyScore.total_score + points,
      tasks_completed: dailyScore.tasks_completed + 1,
    })
    .eq("id", dailyScore.id);

  await supabase
    .from("tasks")
    .update({ points_awarded: points })
    .eq("id", taskId);

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

  await supabase.from("score_events").insert([
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

  const dailyScore = await getOrCreateDailyScore(userId, today);

  await supabase
    .from("daily_scores")
    .update({
      habit_points: dailyScore.habit_points + pointsPerCompletion,
      streak_bonus: dailyScore.streak_bonus + streakBonus,
      total_score: dailyScore.total_score + totalPoints,
      habits_completed: dailyScore.habits_completed + 1,
    })
    .eq("id", dailyScore.id);

  return totalPoints;
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
