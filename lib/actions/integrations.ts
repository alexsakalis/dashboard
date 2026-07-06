"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { encryptTokenSafe } from "@/lib/crypto";
import { syncOuraForUserId } from "@/lib/integrations/oura/sync";
import {
  syncGoogleCalendarForUserId,
  syncGoogleSheetsForUserId,
} from "@/lib/integrations/google/sync";
import { createClient } from "@/lib/supabase/server";
import { extractSpreadsheetId } from "@/lib/integrations/google/client";
import type { IntegrationProvider } from "@/types";

export async function getIntegrations() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("integrations")
    .select("id, provider, config, status, last_synced_at, created_at")
    .eq("user_id", user.id);

  if (error) throw error;
  return data ?? [];
}

export async function saveOuraIntegration(
  refreshToken: string,
  accessToken: string,
  expiresAt: string,
) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("integrations").upsert(
    {
      user_id: user.id,
      provider: "oura" as IntegrationProvider,
      refresh_token_enc: encryptTokenSafe(refreshToken),
      access_token_enc: encryptTokenSafe(accessToken),
      token_expires_at: expiresAt,
      status: "active",
      config: {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" },
  );

  if (error) throw error;

  try {
    await syncOuraForUserId(user.id);
  } catch (syncError) {
    console.error("Oura initial sync failed:", syncError);
  }

  revalidatePath("/settings/integrations");
  revalidatePath("/");
  revalidatePath("/health");
}

export async function syncOuraNow(): Promise<{ days: number } | { error: string }> {
  const user = await requireUser();

  try {
    const days = await syncOuraForUserId(user.id);
    revalidatePath("/settings/integrations");
    revalidatePath("/");
    revalidatePath("/health");
    return { days };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return { error: message };
  }
}

export async function saveGoogleIntegration(
  refreshToken: string,
  accessToken: string | null,
  expiresAt: string | null,
  config: Record<string, unknown>,
) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("integrations").upsert(
    {
      user_id: user.id,
      provider: "google" as IntegrationProvider,
      refresh_token_enc: encryptTokenSafe(refreshToken),
      access_token_enc: accessToken ? encryptTokenSafe(accessToken) : null,
      token_expires_at: expiresAt,
      config,
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" },
  );

  if (error) throw error;

  try {
    await syncGoogleCalendarForUserId(user.id);
  } catch (syncError) {
    console.error("Google initial calendar sync failed:", syncError);
  }

  revalidatePath("/settings/integrations");
  revalidatePath("/");
  revalidatePath("/finance");
}

export async function syncGoogleCalendarNow(): Promise<
  { events: number } | { error: string }
> {
  const user = await requireUser();

  try {
    const events = await syncGoogleCalendarForUserId(user.id);
    revalidatePath("/settings/integrations");
    revalidatePath("/");
    return { events };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return { error: message };
  }
}

export async function syncGoogleSheetsNow(): Promise<
  { rows: number } | { error: string }
> {
  const user = await requireUser();

  try {
    const rows = await syncGoogleSheetsForUserId(user.id);
    revalidatePath("/settings/integrations");
    revalidatePath("/finance");
    return { rows };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return { error: message };
  }
}

export async function saveSpreadsheetConfig(
  spreadsheetId: string,
  sheetName?: string,
) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("integrations")
    .select("config")
    .eq("user_id", user.id)
    .eq("provider", "google")
    .maybeSingle();

  const config = {
    ...(existing?.config as Record<string, unknown> ?? {}),
    spreadsheet_id: extractSpreadsheetId(spreadsheetId),
    sheet_name: sheetName ?? "Transactions",
  };

  const { error } = await supabase
    .from("integrations")
    .update({ config, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("provider", "google");

  if (error) throw error;

  try {
    await syncGoogleSheetsForUserId(user.id);
  } catch (syncError) {
    console.error("Google initial sheets sync failed:", syncError);
  }

  revalidatePath("/settings/integrations");
  revalidatePath("/finance");
}

export async function disconnectIntegration(provider: IntegrationProvider) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("integrations")
    .delete()
    .eq("user_id", user.id)
    .eq("provider", provider);

  if (error) throw error;
  revalidatePath("/settings/integrations");
}

