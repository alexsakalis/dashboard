"use server";

import { subDays } from "date-fns";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  calendarToActivity,
  groupActivityByDate,
  habitToActivity,
  journalToActivity,
  mergeActivityEvents,
  scoreToActivity,
  syncToActivity,
  taskToActivity,
  workoutToActivity,
} from "@/lib/activity/build-timeline";
import type { ActivityEvent } from "@/lib/activity/types";

export async function getActivityTimeline(days = 14) {
  const user = await requireUser();
  const supabase = await createClient();
  const since = subDays(new Date(), days).toISOString();
  const sinceDate = subDays(new Date(), days).toISOString().slice(0, 10);

  const [
    tasksRes,
    habitsRes,
    workoutsRes,
    syncRes,
    calendarRes,
    journalRes,
    scoreRes,
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, title, completed_at, points_awarded")
      .eq("user_id", user.id)
      .eq("status", "done")
      .not("completed_at", "is", null)
      .gte("completed_at", since)
      .order("completed_at", { ascending: false })
      .limit(50),
    supabase
      .from("habit_completions")
      .select("id, habit_id, completed_date, habits(name, icon)")
      .eq("user_id", user.id)
      .gte("completed_date", sinceDate)
      .order("completed_date", { ascending: false })
      .limit(50),
    supabase
      .from("workouts")
      .select("id, name, completed_at, split")
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .gte("completed_at", since)
      .order("completed_at", { ascending: false })
      .limit(30),
    supabase
      .from("integration_sync_logs")
      .select("id, provider, status, message, finished_at, started_at")
      .eq("user_id", user.id)
      .eq("status", "success")
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(20),
    supabase
      .from("calendar_events")
      .select("id, title, start_time, location")
      .eq("user_id", user.id)
      .gte("start_time", since)
      .lte("start_time", new Date().toISOString())
      .order("start_time", { ascending: false })
      .limit(30),
    supabase
      .from("notes")
      .select("id, title, updated_at")
      .eq("user_id", user.id)
      .eq("note_type", "journal")
      .gte("updated_at", since)
      .order("updated_at", { ascending: false })
      .limit(20),
    supabase
      .from("score_events")
      .select("id, event_type, points, created_at")
      .eq("user_id", user.id)
      .in("event_type", ["streak_bonus", "recurring_bonus"])
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const events: ActivityEvent[] = [];

  for (const task of tasksRes.data ?? []) {
    const item = taskToActivity(task);
    if (item) events.push(item);
  }

  for (const row of habitsRes.data ?? []) {
    const joined = row.habits;
    const habit = Array.isArray(joined) ? joined[0] : joined;
    if (!habit?.name) continue;
    events.push(
      habitToActivity({
        id: row.habit_id,
        name: habit.name,
        icon: habit.icon,
        completed_date: row.completed_date,
      }),
    );
  }

  for (const workout of workoutsRes.data ?? []) {
    const item = workoutToActivity({
      id: workout.id,
      name: workout.name,
      completed_at: workout.completed_at,
      split: workout.split,
    });
    if (item) events.push(item);
  }

  for (const log of syncRes.data ?? []) {
    const item = syncToActivity(log);
    if (item) events.push(item);
  }

  for (const event of calendarRes.data ?? []) {
    events.push(calendarToActivity(event));
  }

  for (const note of journalRes.data ?? []) {
    events.push(journalToActivity(note));
  }

  for (const score of scoreRes.data ?? []) {
    events.push(scoreToActivity(score));
  }

  const timeline = mergeActivityEvents(events);
  return {
    events: timeline,
    groups: groupActivityByDate(timeline),
  };
}
