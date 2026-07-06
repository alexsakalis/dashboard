import { createServiceClient } from "@/lib/supabase/server";
import { fetchOuraData } from "@/lib/integrations/oura/client";
import type { Integration } from "@/types";

export async function syncOuraIntegration(
  integration: Integration,
): Promise<number> {
  const supabase = await createServiceClient();
  const dailyData = await fetchOuraData(integration);

  for (const day of dailyData) {
    const { error } = await supabase.from("health_daily_snapshots").upsert(
      {
        user_id: integration.user_id,
        date: day.date,
        source: "oura",
        sleep_score: day.sleep_score,
        sleep_duration_min: day.sleep_duration_min,
        readiness_score: day.readiness_score,
        hrv_ms: day.hrv_ms,
        resting_hr: day.resting_hr,
        steps: day.steps,
        active_calories: day.active_calories,
        workout_count: day.workout_count,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date,source" },
    );

    if (error) throw error;
  }

  const { error: updateError } = await supabase
    .from("integrations")
    .update({ last_synced_at: new Date().toISOString() })
    .eq("id", integration.id);

  if (updateError) throw updateError;

  return dailyData.length;
}

export async function syncOuraForUserId(userId: string): Promise<number> {
  const supabase = await createServiceClient();
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

  return syncOuraIntegration(integration as Integration);
}

export async function syncAllOuraIntegrations(): Promise<{
  synced: number;
  total: number;
}> {
  const supabase = await createServiceClient();
  const { data: integrations, error } = await supabase
    .from("integrations")
    .select("*")
    .eq("provider", "oura")
    .eq("status", "active");

  if (error) throw error;

  let synced = 0;
  for (const integration of integrations ?? []) {
    try {
      await syncOuraIntegration(integration as Integration);
      synced++;
    } catch (err) {
      console.error(`Oura sync failed for user ${integration.user_id}:`, err);
    }
  }

  return { synced, total: integrations?.length ?? 0 };
}
