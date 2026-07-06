"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
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
  const { data: completions } = await supabase
    .from("habit_completions")
    .select("habit_id")
    .eq("user_id", user.id)
    .eq("completed_date", today);

  const completedIds = new Set(completions?.map((c) => c.habit_id) ?? []);

  const habitsWithStatus = await Promise.all(
    (habits ?? []).map(async (habit) => ({
      ...habit,
      completed_today: completedIds.has(habit.id),
      streak: await calculateHabitStreak(user.id, habit.id),
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

export async function seedDefaultHabits() {
  const user = await requireUser();
  const supabase = await createClient();

  const { count } = await supabase
    .from("habits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (count && count > 0) return;

  await supabase.from("habits").insert([
    { user_id: user.id, name: "Pills", icon: "💊", sort_order: 0 },
    { user_id: user.id, name: "Walking", icon: "🚶", sort_order: 1 },
    { user_id: user.id, name: "Reading", icon: "📚", sort_order: 2 },
  ]);
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
  revalidatePath("/habits");
}
