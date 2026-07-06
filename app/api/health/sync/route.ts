import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { parseHealthAutoExport } from "@/lib/integrations/health-ingest/parser";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedKey = process.env.HEALTH_SYNC_API_KEY;

  if (!expectedKey || authHeader !== `Bearer ${expectedKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const userId = process.env.HEALTH_SYNC_USER_ID;

    if (!userId) {
      return NextResponse.json(
        { error: "HEALTH_SYNC_USER_ID not configured" },
        { status: 500 },
      );
    }

    const supabase = await createServiceClient();
    const { snapshot, workouts } = parseHealthAutoExport(payload, userId);

    await supabase.from("health_daily_snapshots").upsert(
      {
        ...snapshot,
        synced_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date,source" },
    );

    for (const workout of workouts) {
      await supabase.from("health_workouts").upsert(workout, {
        onConflict: "user_id,source,external_id",
      });
    }

    await supabase.from("integrations").upsert(
      {
        user_id: userId,
        provider: "apple_health",
        status: "active",
        last_synced_at: new Date().toISOString(),
        config: {},
      },
      { onConflict: "user_id,provider" },
    );

    return NextResponse.json({
      success: true,
      workouts: workouts.length,
      date: snapshot.date,
    });
  } catch (error) {
    console.error("Health sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
