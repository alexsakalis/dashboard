import "server-only";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { encryptTokenSafe } from "@/lib/crypto";
import { refreshDashboardSummary } from "@/lib/integrations/dashboard/update-dashboard-summary";
import { syncGoogleCalendarForUserId } from "@/lib/integrations/google/sync";
import { syncOuraForUserId } from "@/lib/integrations/oura/sync";
import { createClient } from "@/lib/supabase/server";
import type { IntegrationProvider } from "@/types";

async function refreshSummary(userId: string) {
  const supabase = await createClient();
  await refreshDashboardSummary(userId, supabase);
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
      display_name: "Oura Ring",
      enabled: true,
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
    await refreshSummary(user.id);
  } catch (syncError) {
    console.error("Oura initial sync failed:", syncError);
  }

  revalidatePath("/settings/integrations");
  revalidatePath("/");
  revalidatePath("/health");
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
      display_name: "Google Calendar",
      enabled: true,
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
    await refreshSummary(user.id);
  } catch (syncError) {
    console.error("Google initial calendar sync failed:", syncError);
  }

  revalidatePath("/settings/integrations");
  revalidatePath("/");
}
