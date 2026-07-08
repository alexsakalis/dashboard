import type { SupabaseClient } from "@supabase/supabase-js";
import { syncGoogleCalendarIntegrationRows } from "@/lib/integrations/providers/google-calendar";
import { createClient } from "@/lib/supabase/server";
import type { Integration } from "@/types";

export async function syncGoogleCalendarIntegration(
  integration: Integration,
  supabase: SupabaseClient,
): Promise<number> {
  const result = await syncGoogleCalendarIntegrationRows(
    integration,
    supabase,
    "manual",
  );
  if (result.status === "error") {
    throw new Error(result.message);
  }
  return (result.metadata?.rowsUpserted as number | undefined) ?? 0;
}

async function getGoogleIntegration(
  supabase: SupabaseClient,
  userId: string,
): Promise<Integration> {
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
  const supabase = await createClient();
  const integration = await getGoogleIntegration(supabase, userId);
  return syncGoogleCalendarIntegration(integration, supabase);
}

export async function syncAllGoogleCalendarIntegrations(): Promise<{
  synced: number;
  total: number;
}> {
  const { runAllIntegrations } = await import("@/lib/integrations/runner");
  const summary = await runAllIntegrations({ trigger: "cron" });
  const googleResults = summary.results.filter((r) => r.provider === "google");
  return {
    synced: googleResults.filter((r) => r.status === "success").length,
    total: googleResults.length,
  };
}
