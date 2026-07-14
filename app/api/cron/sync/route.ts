import { NextResponse } from "next/server";
import { runAllIntegrations } from "@/lib/integrations/runner";
import { createAdminClient } from "@/lib/server/supabase-admin";
import { processAllRecurrenceRules } from "@/lib/tasks/recurrence";

function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

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
