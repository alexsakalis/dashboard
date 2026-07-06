import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchOuraData } from "@/lib/integrations/oura/client";

function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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
        const dailyData = await fetchOuraData(integration);

        for (const day of dailyData) {
          await supabase.from("health_daily_snapshots").upsert(
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
        }

        await supabase
          .from("integrations")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", integration.id);

        synced++;
      } catch (err) {
        console.error(`Oura sync failed for user ${integration.user_id}:`, err);
      }
    }

    return NextResponse.json({ synced, total: integrations?.length ?? 0 });
  } catch (error) {
    console.error("Oura cron error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
