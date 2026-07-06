import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchCalendarEvents } from "@/lib/integrations/google/client";

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
      .eq("provider", "google")
      .eq("status", "active");

    if (error) throw error;

    let synced = 0;
    for (const integration of integrations ?? []) {
      try {
        const events = await fetchCalendarEvents(integration);

        for (const event of events) {
          await supabase.from("calendar_events").upsert(
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
        }

        await supabase
          .from("integrations")
          .update({ last_synced_at: new Date().toISOString() })
          .eq("id", integration.id);

        synced++;
      } catch (err) {
        console.error(
          `Calendar sync failed for user ${integration.user_id}:`,
          err,
        );
      }
    }

    return NextResponse.json({ synced, total: integrations?.length ?? 0 });
  } catch (error) {
    console.error("Calendar cron error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
