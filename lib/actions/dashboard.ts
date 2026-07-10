"use server";

import { startOfDay, endOfDay } from "date-fns";
import { requireUser } from "@/lib/auth";
import {
  createDefaultDashboardSummary,
  normalizeDashboardSummary,
  refreshDashboardSummary,
} from "@/lib/integrations/dashboard/update-dashboard-summary";
import { createClient } from "@/lib/supabase/server";
import type { DashboardSummary } from "@/types";

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("dashboard_summary")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("dashboard_summary read failed:", error.message);
    try {
      return await refreshDashboardSummary(user.id, supabase);
    } catch (refreshError) {
      console.error("dashboard_summary refresh failed:", refreshError);
      return createDefaultDashboardSummary(user.id);
    }
  }

  if (data) {
    return normalizeDashboardSummary(data as DashboardSummary);
  }

  try {
    return await refreshDashboardSummary(user.id, supabase);
  } catch {
    return createDefaultDashboardSummary(user.id);
  }
}

export async function refreshDashboardSummaryForCurrentUser() {
  const user = await requireUser();
  const supabase = await createClient();
  await refreshDashboardSummary(user.id, supabase);
}

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
