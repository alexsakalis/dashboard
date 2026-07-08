import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { runIntegrationsForUser } from "@/lib/integrations/runner";

const manualSyncTimestamps = new Map<string, number>();
const RATE_LIMIT_MS = 60_000;

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const lastSync = manualSyncTimestamps.get(user.id) ?? 0;

    if (Date.now() - lastSync < RATE_LIMIT_MS) {
      return NextResponse.json(
        { error: "Please wait before syncing again" },
        { status: 429 },
      );
    }

    let providers: string[] | undefined;
    try {
      const body = await request.json();
      if (Array.isArray(body?.providers)) {
        providers = body.providers;
      }
    } catch {
      // Empty body is fine.
    }

    manualSyncTimestamps.set(user.id, Date.now());
    const result = await runIntegrationsForUser(user.id, {
      trigger: "manual",
      providers,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
