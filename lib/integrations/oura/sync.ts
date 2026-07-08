import type { SupabaseClient } from "@supabase/supabase-js";
import { syncOuraIntegrationRows } from "@/lib/integrations/providers/oura";
import { createClient } from "@/lib/supabase/server";
import type { Integration } from "@/types";

export async function syncOuraIntegration(
  integration: Integration,
  supabase: SupabaseClient,
): Promise<number> {
  const result = await syncOuraIntegrationRows(integration, supabase, "manual");
  if (result.status === "error") {
    throw new Error(result.message);
  }
  return (result.metadata?.rowsUpserted as number | undefined) ?? 0;
}

export async function syncOuraForUserId(userId: string): Promise<number> {
  const supabase = await createClient();
  const { data: integration, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("provider", "oura")
    .eq("status", "active")
    .single();

  if (error || !integration) {
    throw new Error("Oura is not connected");
  }

  return syncOuraIntegration(integration as Integration, supabase);
}

export async function syncAllOuraIntegrations(): Promise<{
  synced: number;
  total: number;
}> {
  const { runAllIntegrations } = await import("@/lib/integrations/runner");
  const summary = await runAllIntegrations({ trigger: "cron" });
  const ouraResults = summary.results.filter((r) => r.provider === "oura");
  return {
    synced: ouraResults.filter((r) => r.status === "success").length,
    total: ouraResults.length,
  };
}
