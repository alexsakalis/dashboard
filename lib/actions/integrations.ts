"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { encryptTokenSafe } from "@/lib/crypto";
import { createClient } from "@/lib/supabase/server";
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

export async function saveOuraToken(token: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("integrations").upsert(
    {
      user_id: user.id,
      provider: "oura" as IntegrationProvider,
      access_token_enc: encryptTokenSafe(token),
      status: "active",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,provider" },
  );

  if (error) throw error;
  revalidatePath("/settings/integrations");
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
  revalidatePath("/settings/integrations");
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
    spreadsheet_id: spreadsheetId,
    sheet_name: sheetName ?? "Transactions",
  };

  const { error } = await supabase
    .from("integrations")
    .update({ config, updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("provider", "google");

  if (error) throw error;
  revalidatePath("/settings/integrations");
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const { redirect } = await import("next/navigation");
  redirect("/login");
}
