import { NextResponse } from "next/server";
import { syncAllOuraIntegrations } from "@/lib/integrations/oura/sync";

function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllOuraIntegrations();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Oura cron error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
