import { fetchOuraData } from "@/lib/integrations/oura/client";
import { isOuraOAuthConfigured } from "@/lib/integrations/oura/oauth";
import type { ProviderDefinition, SyncContext, SyncResult } from "@/lib/integrations/types";
import { isReauthError } from "@/lib/integrations/types";
import type { Integration } from "@/types";

const OURA_NULLABLE_METRIC_FIELDS = [
  "sleep_score",
  "sleep_duration_min",
  "readiness_score",
  "hrv_ms",
  "resting_hr",
  "steps",
  "active_calories",
  "activity_score",
] as const;

type OuraSnapshotPayload = {
  user_id: string;
  date: string;
  source: "oura";
  workout_count: number;
  raw_payload: unknown;
  synced_at: string;
} & Partial<Record<(typeof OURA_NULLABLE_METRIC_FIELDS)[number], number>>;

function buildOuraSnapshotPayload(
  integration: Integration,
  day: Awaited<ReturnType<typeof fetchOuraData>>[number],
): OuraSnapshotPayload {
  const payload: OuraSnapshotPayload = {
    user_id: integration.user_id,
    date: day.date,
    source: "oura",
    workout_count: day.workout_count,
    raw_payload: day,
    synced_at: new Date().toISOString(),
  };

  for (const field of OURA_NULLABLE_METRIC_FIELDS) {
    const value = day[field];
    if (value !== null) {
      payload[field] = value;
    }
  }

  return payload;
}

async function syncOuraData(
  integration: Integration,
  ctx: SyncContext,
): Promise<SyncResult> {
  const startedAt = Date.now();

  try {
    const dailyData = await fetchOuraData(integration, 3);

    for (const day of dailyData) {
      const { error } = await ctx.supabase.from("health_daily_snapshots").upsert(
        buildOuraSnapshotPayload(integration, day),
        { onConflict: "user_id,date,source" },
      );

      if (error) throw error;
    }

    return {
      provider: "oura",
      status: "success",
      message: `Synced ${dailyData.length} day(s) of Oura data`,
      durationMs: Date.now() - startedAt,
      metadata: { rowsUpserted: dailyData.length },
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Oura sync failed";
    return {
      provider: "oura",
      status: "error",
      message,
      durationMs: Date.now() - startedAt,
    };
  }
}

export const ouraProvider: ProviderDefinition = {
  provider: "oura",
  displayName: "Oura Ring",

  isConfigured() {
    return isOuraOAuthConfigured();
  },

  isEnabled(integration: Integration) {
    return integration.enabled !== false && integration.status !== "error";
  },

  async sync(ctx: SyncContext): Promise<SyncResult> {
    if (!this.isConfigured()) {
      return {
        provider: "oura",
        status: "skipped",
        message: "Oura OAuth credentials not configured",
        durationMs: 0,
      };
    }

    const result = await syncOuraData(ctx.integration, ctx);

    if (result.status === "error" && isReauthError(result.message)) {
      await ctx.supabase
        .from("integrations")
        .update({ status: "reauth_required", updated_at: new Date().toISOString() })
        .eq("id", ctx.integration.id);
    }

    return result;
  },
};

export async function syncOuraIntegrationRows(
  integration: Integration,
  supabase: SyncContext["supabase"],
  trigger: SyncContext["trigger"] = "manual",
): Promise<SyncResult> {
  return ouraProvider.sync({
    integration,
    supabase,
    userId: integration.user_id,
    trigger,
  });
}
