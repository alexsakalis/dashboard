import { NextResponse } from "next/server";
import { verifyCronAuth } from "@/lib/cron-auth";
import { runAllIntegrations } from "@/lib/integrations/runner";

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAllIntegrations({
      trigger: "cron",
      providers: ["oura"],
    });
    return NextResponse.json({
      synced: result.results.filter(
        (r) => r.provider === "oura" && r.status === "success",
      ).length,
      total: result.results.filter((r) => r.provider === "oura").length,
      ...result,
    });
  } catch (error) {
    console.error("Oura cron error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
