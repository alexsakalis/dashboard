import type { SupabaseClient } from "@supabase/supabase-js";
import type { Integration, SyncLogStatus } from "@/types";
import type { SyncResult } from "@/lib/integrations/types";
import { isReauthError } from "@/lib/integrations/types";

export async function startSyncLog(
  supabase: SupabaseClient,
  integration: Integration,
  provider: string,
): Promise<string> {
  const { data, error } = await supabase
    .from("integration_sync_logs")
    .insert({
      integration_id: integration.id,
      user_id: integration.user_id,
      provider,
      status: "running" satisfies SyncLogStatus,
      message: "Sync started",
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function finishSyncLog(
  supabase: SupabaseClient,
  logId: string,
  result: SyncResult,
): Promise<void> {
  const status: SyncLogStatus =
    result.status === "success"
      ? "success"
      : result.status === "skipped"
        ? "skipped"
        : "error";

  const { error } = await supabase
    .from("integration_sync_logs")
    .update({
      status,
      message: result.message,
      finished_at: new Date().toISOString(),
      duration_ms: result.durationMs,
      metadata: result.metadata ?? {},
    })
    .eq("id", logId);

  if (error) throw error;
}

export async function logSyncError(
  supabase: SupabaseClient,
  logId: string,
  provider: string,
  err: unknown,
  startedAt: number,
): Promise<SyncResult> {
  const message = err instanceof Error ? err.message : "Sync failed";
  const result: SyncResult = {
    provider,
    status: "error",
    message,
    durationMs: Date.now() - startedAt,
  };

  await finishSyncLog(supabase, logId, result);
  return result;
}

export async function updateIntegrationStatus(
  supabase: SupabaseClient,
  integrationId: string,
  result: SyncResult,
): Promise<void> {
  const now = new Date().toISOString();
  const updates: Record<string, unknown> = {
    last_synced_at: now,
    last_message: result.message,
    updated_at: now,
  };

  if (result.status === "success") {
    updates.last_success_at = now;
    updates.status = "active";
  } else if (result.status === "error") {
    updates.last_failure_at = now;
    updates.status = isReauthError(result.message) ? "reauth_required" : "error";
  }

  const { error } = await supabase
    .from("integrations")
    .update(updates)
    .eq("id", integrationId);

  if (error) throw error;
}

export async function createSkippedLog(
  supabase: SupabaseClient,
  integration: Integration | null,
  userId: string,
  provider: string,
  message: string,
): Promise<SyncResult> {
  const result: SyncResult = {
    provider,
    status: "skipped",
    message,
    durationMs: 0,
  };

  await supabase.from("integration_sync_logs").insert({
    integration_id: integration?.id ?? null,
    user_id: userId,
    provider,
    status: "skipped",
    message,
    finished_at: new Date().toISOString(),
    duration_ms: 0,
  });

  if (integration) {
    await supabase
      .from("integrations")
      .update({
        last_synced_at: new Date().toISOString(),
        last_message: message,
        updated_at: new Date().toISOString(),
      })
      .eq("id", integration.id);
  }

  return result;
}
