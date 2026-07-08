import type { SupabaseClient } from "@supabase/supabase-js";
import { refreshDashboardSummary } from "@/lib/integrations/dashboard/update-dashboard-summary";
import {
  createSkippedLog,
  finishSyncLog,
  logSyncError,
  startSyncLog,
  updateIntegrationStatus,
} from "@/lib/integrations/logging/sync-log";
import { getProvider } from "@/lib/integrations/registry";
import type {
  RunIntegrationsOptions,
  RunSummary,
  SyncResult,
} from "@/lib/integrations/types";
import { createAdminClient } from "@/lib/server/supabase-admin";
import type { Integration } from "@/types";

const USER_CONCURRENCY = 5;

async function runIntegrationSync(
  supabase: SupabaseClient,
  integration: Integration,
  trigger: RunIntegrationsOptions["trigger"],
): Promise<SyncResult> {
  const providerDef = getProvider(integration.provider);

  if (!providerDef) {
    return createSkippedLog(
      supabase,
      integration,
      integration.user_id,
      integration.provider,
      `Unknown provider: ${integration.provider}`,
    );
  }

  if (!providerDef.isConfigured()) {
    return createSkippedLog(
      supabase,
      integration,
      integration.user_id,
      integration.provider,
      `${providerDef.displayName} is not configured in environment`,
    );
  }

  if (!providerDef.isEnabled(integration)) {
    return createSkippedLog(
      supabase,
      integration,
      integration.user_id,
      integration.provider,
      `${providerDef.displayName} is disabled`,
    );
  }

  const startedAt = Date.now();
  let logId: string;

  try {
    logId = await startSyncLog(supabase, integration, integration.provider);
  } catch (err) {
    console.error("Failed to start sync log:", err);
    return providerDef.sync({
      integration,
      supabase,
      userId: integration.user_id,
      trigger: trigger ?? "cron",
    });
  }

  try {
    const result = await providerDef.sync({
      integration,
      supabase,
      userId: integration.user_id,
      trigger: trigger ?? "cron",
    });

    await finishSyncLog(supabase, logId, result);
    await updateIntegrationStatus(supabase, integration.id, result);
    return result;
  } catch (err) {
    const result = await logSyncError(
      supabase,
      logId,
      integration.provider,
      err,
      startedAt,
    );
    await updateIntegrationStatus(supabase, integration.id, result);
    return result;
  }
}

export async function runIntegrationsForUser(
  userId: string,
  options: RunIntegrationsOptions = {},
): Promise<RunSummary> {
  const startedAt = Date.now();
  const supabase = await createAdminClient();
  const trigger = options.trigger ?? "manual";
  const providerFilter = options.providers
    ? new Set(options.providers)
    : null;

  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("user_id", userId)
    .eq("enabled", true);

  if (error) {
    return {
      success: false,
      durationMs: Date.now() - startedAt,
      usersProcessed: 0,
      results: [],
      errors: [error.message],
    };
  }

  const results: SyncResult[] = [];
  const errors: string[] = [];

  for (const row of integrations ?? []) {
    const integration = row as Integration;
    if (providerFilter && !providerFilter.has(integration.provider)) {
      continue;
    }

    const result = await runIntegrationSync(supabase, integration, trigger);
    results.push(result);
    if (result.status === "error") {
      errors.push(`${integration.provider}: ${result.message}`);
    }
  }

  try {
    await refreshDashboardSummary(userId, supabase);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Summary refresh failed";
    errors.push(message);
  }

  return {
    success: errors.length === 0,
    durationMs: Date.now() - startedAt,
    usersProcessed: 1,
    results,
    errors,
  };
}

async function runUserBatch(
  userIds: string[],
  trigger: RunIntegrationsOptions["trigger"],
  providerFilter?: Set<string>,
) {
  const supabase = await createAdminClient();
  const results: SyncResult[] = [];
  const errors: string[] = [];

  for (const userId of userIds) {
    const { data: integrations } = await supabase
      .from("integrations")
      .select("*")
      .eq("user_id", userId)
      .eq("enabled", true);

    for (const row of integrations ?? []) {
      const integration = row as Integration;
      if (providerFilter && !providerFilter.has(integration.provider)) {
        continue;
      }

      const result = await runIntegrationSync(
        supabase,
        integration,
        trigger,
      );
      results.push(result);
      if (result.status === "error") {
        errors.push(`${userId}/${row.provider}: ${result.message}`);
      }
    }

    try {
      await refreshDashboardSummary(userId, supabase);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Summary refresh failed";
      errors.push(`${userId}: ${message}`);
    }
  }

  return { results, errors };
}

export async function runAllIntegrations(
  options: RunIntegrationsOptions = {},
): Promise<RunSummary> {
  const startedAt = Date.now();
  const supabase = await createAdminClient();
  const trigger = options.trigger ?? "cron";
  const providerFilter = options.providers
    ? new Set(options.providers)
    : undefined;

  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("user_id, provider")
    .eq("enabled", true);

  if (error) {
    return {
      success: false,
      durationMs: Date.now() - startedAt,
      usersProcessed: 0,
      results: [],
      errors: [error.message],
    };
  }

  const filteredRows = (integrations ?? []).filter(
    (row) => !providerFilter || providerFilter.has(row.provider),
  );
  const userIds = [...new Set(filteredRows.map((i) => i.user_id))];

  if (userIds.length === 0) {
    return {
      success: true,
      durationMs: Date.now() - startedAt,
      usersProcessed: 0,
      results: [],
      errors: [],
    };
  }

  const allResults: SyncResult[] = [];
  const allErrors: string[] = [];

  for (let i = 0; i < userIds.length; i += USER_CONCURRENCY) {
    const batch = userIds.slice(i, i + USER_CONCURRENCY);
    const batchOutcomes = await Promise.allSettled(
      batch.map((userId) => runUserBatch([userId], trigger, providerFilter)),
    );

    for (const outcome of batchOutcomes) {
      if (outcome.status === "fulfilled") {
        allResults.push(...outcome.value.results);
        allErrors.push(...outcome.value.errors);
      } else {
        allErrors.push(
          outcome.reason instanceof Error
            ? outcome.reason.message
            : "Batch sync failed",
        );
      }
    }
  }

  return {
    success: allErrors.length === 0,
    durationMs: Date.now() - startedAt,
    usersProcessed: userIds.length,
    results: allResults,
    errors: allErrors,
  };
}
