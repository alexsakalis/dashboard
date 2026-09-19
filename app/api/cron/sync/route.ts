import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { runAllIntegrations } from "@/lib/integrations/runner";
import { createAdminClient } from "@/lib/server/supabase-admin";
import { processAllRecurrenceRules } from "@/lib/tasks/recurrence";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAllIntegrations({ trigger: "cron" });
    const supabase = await createAdminClient();
    const recurring = await processAllRecurrenceRules(supabase);
    return NextResponse.json({ ...result, recurring });
  } catch (error) {
    console.error("Integration cron error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
