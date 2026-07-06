"use server";

import { revalidatePath } from "next/cache";
import { format, startOfDay, endOfDay } from "date-fns";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function getFinanceEntries(limit = 20) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("finance_entries")
    .select("*")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getFinanceSummary() {
  const user = await requireUser();
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data: todayEntries } = await supabase
    .from("finance_entries")
    .select("amount, entry_type")
    .eq("user_id", user.id)
    .eq("date", today);

  const entries = todayEntries ?? [];
  const spent = entries
    .filter((e) => e.entry_type === "expense")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const income = entries
    .filter((e) => e.entry_type === "income")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const startOfMonth = format(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    "yyyy-MM-dd",
  );

  const { data: monthEntries } = await supabase
    .from("finance_entries")
    .select("amount, entry_type")
    .eq("user_id", user.id)
    .gte("date", startOfMonth);

  const monthSpent = (monthEntries ?? [])
    .filter((e) => e.entry_type === "expense")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return { spentToday: spent, incomeToday: income, spentMonth: monthSpent };
}

export async function createFinanceEntry(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("finance_entries").insert({
    user_id: user.id,
    date: formData.get("date") as string,
    amount: parseFloat(formData.get("amount") as string),
    category: (formData.get("category") as string) || null,
    merchant: (formData.get("merchant") as string) || null,
    account: (formData.get("account") as string) || null,
    notes: (formData.get("notes") as string) || null,
    entry_type: (formData.get("entry_type") as string) || "expense",
    sync_source: "app",
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/finance");
}

export async function updateFinanceEntry(
  entryId: string,
  updates: {
    amount?: number;
    category?: string | null;
    merchant?: string | null;
    notes?: string | null;
  },
) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("finance_entries")
    .select("version")
    .eq("id", entryId)
    .single();

  const { error } = await supabase
    .from("finance_entries")
    .update({
      ...updates,
      sync_source: "app",
      updated_at: new Date().toISOString(),
      version: (existing?.version ?? 0) + 1,
    })
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/finance");
}

export async function deleteFinanceEntry(entryId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("finance_entries")
    .delete()
    .eq("id", entryId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/finance");
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
