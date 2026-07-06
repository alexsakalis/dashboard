import { NextResponse } from "next/server";
import { syncAllGoogleSheetsIntegrations } from "@/lib/integrations/google/sync";

function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: Request) {
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncAllGoogleSheetsIntegrations();
    return NextResponse.json(result);
  } catch (error) {
    console.error("Sheets cron error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
