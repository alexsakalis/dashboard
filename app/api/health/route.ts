import { NextResponse } from "next/server";
import { getDeploymentHealth } from "@/lib/env";

export async function GET() {
  const checks = getDeploymentHealth();
  const ok = checks.supabasePublic && checks.supabaseServiceRole;

  return NextResponse.json(
    {
      ok,
      checks,
    },
    { status: ok ? 200 : 503 },
  );
}
