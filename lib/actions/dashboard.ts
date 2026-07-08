"use server";

import { startOfDay, endOfDay } from "date-fns";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function getCalendarEvents(limit = 10) {
  const user = await requireUser();
  const supabase = await createClient();
  const now = new Date();

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", user.id)
    .gte("start_time", startOfDay(now).toISOString())
    .lte("start_time", endOfDay(now).toISOString())
    .order("start_time")
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getUpcomingCalendarEvents(limit = 10) {
  const user = await requireUser();
  const supabase = await createClient();
  const now = new Date();

  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", user.id)
    .gt("start_time", now.toISOString())
    .order("start_time")
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getHealthSnapshots(days = 7) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("health_daily_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(days * 2);

  if (error) throw error;
  return data ?? [];
}
