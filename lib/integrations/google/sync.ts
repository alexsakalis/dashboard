import { createServiceClient } from "@/lib/supabase/server";
import { fetchCalendarEvents } from "@/lib/integrations/google/client";
import type { Integration } from "@/types";

export async function syncGoogleCalendarIntegration(
  integration: Integration,
): Promise<number> {
  const supabase = await createServiceClient();
  const events = await fetchCalendarEvents(integration);

  for (const event of events) {
    const { error } = await supabase.from("calendar_events").upsert(
      {
        user_id: integration.user_id,
        external_id: event.external_id,
        title: event.title,
        start_time: event.start_time,
        end_time: event.end_time,
        all_day: event.all_day,
        location: event.location,
        raw_payload: event.raw_payload,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,external_id" },
    );

    if (error) throw error;
  }

  const { error: updateError } = await supabase
    .from("integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", integration.id);

  if (updateError) throw updateError;

  return events.length;
}

async function getGoogleIntegration(userId: string): Promise<Integration> {
  const supabase = await createServiceClient();
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
  const integration = await getGoogleIntegration(userId);
  return syncGoogleCalendarIntegration(integration);
}

export async function syncAllGoogleCalendarIntegrations(): Promise<{
  synced: number;
  total: number;
}> {
  const supabase = await createServiceClient();
  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("provider", "google")
    .eq("status", "active");

  if (error) throw error;

  let synced = 0;
  for (const integration of integrations ?? []) {
    try {
      await syncGoogleCalendarIntegration(integration as Integration);
      synced++;
    } catch (err) {
      console.error(
        `Calendar sync failed for user ${integration.user_id}:`,
        err,
      );
    }
  }

  return { synced, total: integrations?.length ?? 0 };
}
