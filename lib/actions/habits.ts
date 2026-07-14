"use server";

import { revalidatePath } from "next/cache";
import { format, subDays } from "date-fns";
import { requireUser } from "@/lib/auth";
import { getHealthSnapshots, refreshDashboardSummaryForCurrentUser } from "@/lib/actions/dashboard";
import { createClient } from "@/lib/supabase/server";
import {
  buildHabitHealthInsights,
  formatHabitInsight,
} from "@/lib/health/habit-insights";
import {
  awardHabitPoints,
  calculateHabitStreak,
} from "@/lib/scoring/actions";

export async function getHabits() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: habits, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("sort_order");

  if (error) throw error;

  const today = format(new Date(), "yyyy-MM-dd");
  const weekStart = format(subDays(new Date(), 6), "yyyy-MM-dd");
  const { data: completions } = await supabase
    .from("habit_completions")
    .select("habit_id, completed_date")
    .eq("user_id", user.id)
    .gte("completed_date", weekStart);

  const todayCompletions = new Set<string>();
  const recentByHabit = new Map<string, string[]>();

  for (const row of completions ?? []) {
    if (row.completed_date === today) {
      todayCompletions.add(row.habit_id);
    }
    const dates = recentByHabit.get(row.habit_id) ?? [];
    dates.push(row.completed_date);
    recentByHabit.set(row.habit_id, dates);
  }

  const habitsWithStatus = await Promise.all(
    (habits ?? []).map(async (habit) => ({
      ...habit,
      completed_today: todayCompletions.has(habit.id),
      streak: await calculateHabitStreak(user.id, habit.id),
      recentCompletions: recentByHabit.get(habit.id) ?? [],
    })),
  );

  return habitsWithStatus;
}

export async function toggleHabit(habitId: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: existing } = await supabase
    .from("habit_completions")
    .select("id")
    .eq("habit_id", habitId)
    .eq("completed_date", today)
    .maybeSingle();

  if (existing) {
    await supabase.from("habit_completions").delete().eq("id", existing.id);
  } else {
    const { data: habit } = await supabase
      .from("habits")
      .select("*")
      .eq("id", habitId)
      .single();

    if (!habit) throw new Error("Habit not found");

    await supabase.from("habit_completions").insert({
      user_id: user.id,
      habit_id: habitId,
      completed_date: today,
    });

    const streak = await calculateHabitStreak(user.id, habitId);
    await awardHabitPoints(
      user.id,
      habitId,
      habit.points_per_completion,
      streak,
    );
  }

  revalidatePath("/");
  revalidatePath("/habits");
  await refreshDashboardSummaryForCurrentUser();
}

export async function createHabit(name: string, icon?: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("habits").insert({
    user_id: user.id,
    name,
    icon: icon ?? null,
  });

  if (error) throw error;
  revalidatePath("/habits");
}

export async function seedDefaultHabits(): Promise<boolean> {
  const user = await requireUser();
  const supabase = await createClient();

  const { count } = await supabase
    .from("habits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (count && count > 0) return false;

  await supabase.from("habits").insert([
    { user_id: user.id, name: "Pills", icon: "💊", sort_order: 0 },
    { user_id: user.id, name: "Walking", icon: "🚶", sort_order: 1 },
    { user_id: user.id, name: "Reading", icon: "📚", sort_order: 2 },
  ]);
  return true;
}

export async function updateHabit(
  habitId: string,
  updates: { name: string; icon: string | null },
) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("habits")
    .update({
      name: updates.name.trim(),
      icon: updates.icon?.trim() || null,
    })
    .eq("id", habitId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/habits");
  await refreshDashboardSummaryForCurrentUser();
}

export async function getHabitHealthInsightLines() {
  const user = await requireUser();
  const supabase = await createClient();
  const since = format(subDays(new Date(), 29), "yyyy-MM-dd");

  const [habitsRes, completionsRes, snapshots] = await Promise.all([
    supabase
      .from("habits")
      .select("id, name, icon")
      .eq("user_id", user.id)
      .eq("active", true),
    supabase
      .from("habit_completions")
      .select("habit_id, completed_date")
      .eq("user_id", user.id)
      .gte("completed_date", since),
    getHealthSnapshots(30),
  ]);

  const insights = buildHabitHealthInsights({
    habits: habitsRes.data ?? [],
    completions: completionsRes.data ?? [],
    snapshots,
  });

  return insights.map(formatHabitInsight);
}

export async function deleteHabit(habitId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("habits")
    .update({ active: false })
    .eq("id", habitId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/habits");
  await refreshDashboardSummaryForCurrentUser();
}
