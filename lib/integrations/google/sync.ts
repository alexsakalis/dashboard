import { createServiceClient } from "@/lib/supabase/server";
import {
  pullFinanceFromSheet,
  pushFinanceToSheet,
  ensureSheetHeaders,
  fetchCalendarEvents,
} from "@/lib/integrations/google/client";
import type { Integration } from "@/types";

export async function syncGoogleCalendarIntegration(
  integration: Integration,
): Promise<number> {
  const supabase = await createServiceClient();
  const events = await fetchCalendarEvents(integration);

  for (const event of events) {
    const { error } = await supabase.from("calendar_events").upsert(
      {
        user_id: integration.user_id,
        external_id: event.external_id,
        title: event.title,
        start_time: event.start_time,
        end_time: event.end_time,
        all_day: event.all_day,
        location: event.location,
        raw_payload: event.raw_payload,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,external_id" },
    );

    if (error) throw error;
  }

  const { error: updateError } = await supabase
    .from("integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", integration.id);

  if (updateError) throw updateError;

  return events.length;
}

export async function syncGoogleSheetsIntegration(
  integration: Integration,
): Promise<number> {
  if (!integration.config?.spreadsheet_id) {
    throw new Error("Spreadsheet ID not configured");
  }

  const supabase = await createServiceClient();
  await ensureSheetHeaders(integration);

  const sheetEntries = await pullFinanceFromSheet(
    integration,
    integration.user_id,
  );

  for (const entry of sheetEntries) {
    const { data: existing } = await supabase
      .from("finance_entries")
      .select("*")
      .eq("row_id", entry.row_id)
      .maybeSingle();

    if (!existing) {
      await supabase.from("finance_entries").insert({
        ...entry,
        user_id: integration.user_id,
      });
    } else if (
      new Date(entry.updated_at) > new Date(existing.updated_at) &&
      entry.sync_source === "sheet"
    ) {
      await supabase
        .from("finance_entries")
        .update({
          date: entry.date,
          amount: entry.amount,
          category: entry.category,
          merchant: entry.merchant,
          account: entry.account,
          notes: entry.notes,
          entry_type: entry.entry_type,
          updated_at: entry.updated_at,
          sync_source: "sheet",
        })
        .eq("row_id", entry.row_id);
    }
  }

  const { data: appEntries } = await supabase
    .from("finance_entries")
    .select("*")
    .eq("user_id", integration.user_id)
    .eq("sync_source", "app");

  if (appEntries?.length) {
    const { data: allEntries } = await supabase
      .from("finance_entries")
      .select("*")
      .eq("user_id", integration.user_id)
      .order("date", { ascending: false });

    if (allEntries) {
      await pushFinanceToSheet(integration, allEntries);
    }
  }

  await supabase.from("finance_sync_log").insert({
    user_id: integration.user_id,
    direction: "pull",
    rows_affected: sheetEntries.length,
    status: "success",
  });

  const { error: updateError } = await supabase
    .from("integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", integration.id);

  if (updateError) throw updateError;

  return sheetEntries.length;
}

async function getGoogleIntegration(userId: string): Promise<Integration> {
  const supabase = await createServiceClient();
  const { data: integration, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "google")
    .eq("status", "active")
    .single();

  if (error || !integration) {
    throw new Error("Google is not connected");
  }

  return integration as Integration;
}

export async function syncGoogleCalendarForUserId(
  userId: string,
): Promise<number> {
  const integration = await getGoogleIntegration(userId);
  return syncGoogleCalendarIntegration(integration);
}

export async function syncGoogleSheetsForUserId(userId: string): Promise<number> {
  const integration = await getGoogleIntegration(userId);
  return syncGoogleSheetsIntegration(integration);
}

export async function syncAllGoogleCalendarIntegrations(): Promise<{
  synced: number;
  total: number;
}> {
  const supabase = await createServiceClient();
  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("provider", "google")
    .eq("status", "active");

  if (error) throw error;

  let synced = 0;
  for (const integration of integrations ?? []) {
    try {
      await syncGoogleCalendarIntegration(integration as Integration);
      synced++;
    } catch (err) {
      console.error(
        `Calendar sync failed for user ${integration.user_id}:`,
        err,
      );
    }
  }

  return { synced, total: integrations?.length ?? 0 };
}

export async function syncAllGoogleSheetsIntegrations(): Promise<{
  synced: number;
  total: number;
}> {
  const supabase = await createServiceClient();
  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("provider", "google")
    .eq("status", "active");

  if (error) throw error;

  let synced = 0;
  for (const integration of integrations ?? []) {
    if (!integration.config?.spreadsheet_id) continue;

    try {
      await syncGoogleSheetsIntegration(integration as Integration);
      synced++;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      await supabase.from("finance_sync_log").insert({
        user_id: integration.user_id,
        direction: "pull",
        rows_affected: 0,
        status: "error",
        error: message,
      });
      console.error(`Sheets sync failed for user ${integration.user_id}:`, err);
    }
  }

  return { synced, total: integrations?.length ?? 0 };
}
