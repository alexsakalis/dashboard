import type { SupabaseClient } from "@supabase/supabase-js";
import {
  encryptTokenSafe,
  fetchCalendarEvents,
  isGoogleOAuthConfigured,
} from "@/lib/integrations/google/client";
import type { ProviderDefinition, SyncContext, SyncResult } from "@/lib/integrations/types";
import { isReauthError } from "@/lib/integrations/types";
import type { Integration } from "@/types";

async function persistGoogleTokens(
  supabase: SupabaseClient,
  integration: Integration,
  credentials: {
    access_token?: string | null;
    expiry_date?: number | null;
  },
): Promise<void> {
  if (!credentials.access_token) return;

  await supabase
    .from("integrations")
    .update({
      access_token_enc: encryptTokenSafe(credentials.access_token),
      token_expires_at: credentials.expiry_date
        ? new Date(credentials.expiry_date).toISOString()
        : integration.token_expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq("id", integration.id);
}

type CalendarSyncWindow = Awaited<ReturnType<typeof fetchCalendarEvents>>["syncWindow"];

async function deleteStaleGoogleCalendarEvents(
  supabase: SupabaseClient,
  userId: string,
  activeExternalIds: Set<string>,
  syncWindow: CalendarSyncWindow,
): Promise<number> {
  const { data: existingEvents, error: readError } = await supabase
    .from("calendar_events")
    .select("id, external_id")
    .eq("user_id", userId)
    .eq("source", "google")
    .lt("start_time", syncWindow.timeMax)
    .gt("end_time", syncWindow.timeMin);

  if (readError) throw readError;

  const staleIds = (existingEvents ?? [])
    .filter((event) => !activeExternalIds.has(event.external_id))
    .map((event) => event.id);

  if (staleIds.length === 0) return 0;

  const { error: deleteError } = await supabase
    .from("calendar_events")
    .delete()
    .eq("user_id", userId)
    .eq("source", "google")
    .in("id", staleIds);

  if (deleteError) throw deleteError;
  return staleIds.length;
}

async function syncGoogleCalendarData(
  integration: Integration,
  ctx: SyncContext,
): Promise<SyncResult> {
  const startedAt = Date.now();

  try {
    const { events, refreshedCredentials, syncWindow } =
      await fetchCalendarEvents(integration);
    await persistGoogleTokens(ctx.supabase, integration, refreshedCredentials);
    const activeExternalIds = new Set(events.map((event) => event.external_id));

    for (const event of events) {
      const { error } = await ctx.supabase.from("calendar_events").upsert(
        {
          user_id: integration.user_id,
          external_id: event.external_id,
          title: event.title,
          start_time: event.start_time,
          end_time: event.end_time,
          all_day: event.all_day,
          location: event.location,
          source: "google",
          raw_payload: event.raw_payload,
          synced_at: new Date().toISOString(),
        },
        { onConflict: "user_id,external_id" },
      );

      if (error) throw error;
    }

    const rowsDeleted = await deleteStaleGoogleCalendarEvents(
      ctx.supabase,
      integration.user_id,
      activeExternalIds,
      syncWindow,
    );

    return {
      provider: "google",
      status: "success",
      message: `Synced ${events.length} calendar event(s), removed ${rowsDeleted} stale event(s)`,
      durationMs: Date.now() - startedAt,
      metadata: { rowsUpserted: events.length, rowsDeleted },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Google Calendar sync failed";
    return {
      provider: "google",
      status: "error",
      message,
      durationMs: Date.now() - startedAt,
    };
  }
}

export const googleCalendarProvider: ProviderDefinition = {
  provider: "google",
  displayName: "Google Calendar",

  isConfigured() {
    return isGoogleOAuthConfigured();
  },

  isEnabled(integration: Integration) {
    return integration.enabled !== false && integration.status !== "error";
  },

  async sync(ctx: SyncContext): Promise<SyncResult> {
    if (!this.isConfigured()) {
      return {
        provider: "google",
        status: "skipped",
        message: "Google OAuth credentials not configured",
        durationMs: 0,
      };
    }

    const result = await syncGoogleCalendarData(ctx.integration, ctx);

    if (result.status === "error" && isReauthError(result.message)) {
      await ctx.supabase
        .from("integrations")
        .update({
          status: "reauth_required",
          updated_at: new Date().toISOString(),
        })
        .eq("id", ctx.integration.id);
    }

    return result;
  },
};

export async function syncGoogleCalendarIntegrationRows(
  integration: Integration,
  supabase: SyncContext["supabase"],
  trigger: SyncContext["trigger"] = "manual",
): Promise<SyncResult> {
  return googleCalendarProvider.sync({
    integration,
    supabase,
    userId: integration.user_id,
    trigger,
  });
}
