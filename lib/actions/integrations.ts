"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
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
