"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { buildWeeklyReview } from "@/lib/productivity/weekly-review";

export interface JournalEntry {
  id: string;
  date: string;
  body: string;
  updated_at: string;
}

function journalDateKey(date = new Date()): string {
  return format(date, "yyyy-MM-dd");
}

export async function getJournalEntry(
  dateStr?: string,
): Promise<JournalEntry | null> {
  const user = await requireUser();
  const supabase = await createClient();
  const date = dateStr ?? journalDateKey();

  const { data, error } = await supabase
    .from("notes")
    .select("id, body, updated_at, title")
    .eq("user_id", user.id)
    .eq("note_type", "journal")
    .eq("title", date)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    date,
    body: data.body ?? "",
    updated_at: data.updated_at,
  };
}

export async function getRecentJournalEntries(limit = 14): Promise<JournalEntry[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("notes")
    .select("id, title, body, updated_at")
    .eq("user_id", user.id)
    .eq("note_type", "journal")
    .order("title", { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    date: row.title ?? format(new Date(row.updated_at), "yyyy-MM-dd"),
    body: row.body ?? "",
    updated_at: row.updated_at,
  }));
}

export async function saveJournalEntry(body: string, dateStr?: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const date = dateStr ?? journalDateKey();
  const trimmed = body.trim();

  const { data: existing } = await supabase
    .from("notes")
    .select("id")
    .eq("user_id", user.id)
    .eq("note_type", "journal")
    .eq("title", date)
    .maybeSingle();

  if (existing) {
    if (!trimmed) {
      const { error } = await supabase.from("notes").delete().eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("notes")
        .update({ body: trimmed, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
      if (error) throw error;
    }
  } else if (trimmed) {
    const { error } = await supabase.from("notes").insert({
      user_id: user.id,
      note_type: "journal",
      title: date,
      body: trimmed,
    });
    if (error) throw error;
  }

  revalidatePath("/journal");
}

export async function getWeeklyReview() {
  const user = await requireUser();
  const supabase = await createClient();
  return buildWeeklyReview(supabase, user.id);
}
