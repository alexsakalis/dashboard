"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { encryptTokenSafe } from "@/lib/crypto";
import { refreshDashboardSummary } from "@/lib/integrations/dashboard/update-dashboard-summary";
import { runIntegrationsForUser } from "@/lib/integrations/runner";
import { syncOuraForUserId } from "@/lib/integrations/oura/sync";
import { syncGoogleCalendarForUserId } from "@/lib/integrations/google/sync";
import { createClient } from "@/lib/supabase/server";
import type { IntegrationProvider } from "@/types";

export async function getIntegrations() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("integrations")
    .select(
      "id, provider, display_name, config, status, enabled, last_synced_at, last_success_at, last_message, created_at",
    )
    .eq("user_id", user.id);

  if (error) throw error;
  return data ?? [];
}

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

export async function syncOuraNow(): Promise<{ days: number } | { error: string }> {
  const user = await requireUser();

  try {
    const days = await syncOuraForUserId(user.id);
    await refreshSummary(user.id);
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

export async function syncGoogleCalendarNow(): Promise<
  { events: number } | { error: string }
> {
  const user = await requireUser();

  try {
    const events = await syncGoogleCalendarForUserId(user.id);
    await refreshSummary(user.id);
    revalidatePath("/settings/integrations");
    revalidatePath("/");
    return { events };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return { error: message };
  }
}

export async function syncAllNow(): Promise<
  | {
      success: boolean;
      durationMs: number;
      results: Array<{
        provider: string;
        status: string;
        message: string;
        durationMs: number;
      }>;
      errors: string[];
    }
  | { error: string }
> {
  const user = await requireUser();

  try {
    const result = await runIntegrationsForUser(user.id, { trigger: "manual" });
    revalidatePath("/settings/integrations");
    revalidatePath("/");
    revalidatePath("/health");
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return { error: message };
  }
}

export async function syncProviderNow(
  provider: IntegrationProvider,
): Promise<
  | {
      success: boolean;
      durationMs: number;
      results: Array<{
        provider: string;
        status: string;
        message: string;
        durationMs: number;
      }>;
      errors: string[];
    }
  | { error: string }
> {
  const user = await requireUser();

  try {
    const result = await runIntegrationsForUser(user.id, {
      trigger: "manual",
      providers: [provider],
    });
    revalidatePath("/settings/integrations");
    revalidatePath("/");
    revalidatePath("/health");
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Sync failed";
    return { error: message };
  }
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

  try {
    await refreshSummary(user.id);
  } catch (refreshError) {
    console.error("Dashboard summary refresh failed:", refreshError);
  }

  revalidatePath("/settings/integrations");
  revalidatePath("/");
}
