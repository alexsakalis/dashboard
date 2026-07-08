import { runIntegrationsForUser } from "@/lib/integrations/runner";

function getGoogleRowsUpserted(
  results: Awaited<ReturnType<typeof runIntegrationsForUser>>["results"],
): number {
  const googleResult = results.find((result) => result.provider === "google");
  if (!googleResult) {
    throw new Error("Google is not connected");
  }
  if (googleResult.status === "skipped") {
    throw new Error(googleResult.message);
  }
  if (googleResult.status === "error") {
    throw new Error(googleResult.message);
  }
  return (googleResult.metadata?.rowsUpserted as number | undefined) ?? 0;
}

export async function syncGoogleCalendarForUserId(
  userId: string,
): Promise<number> {
  const summary = await runIntegrationsForUser(userId, {
    trigger: "manual",
    providers: ["google"],
  });
  return getGoogleRowsUpserted(summary.results);
}

export async function syncAllGoogleCalendarIntegrations(): Promise<{
  synced: number;
  total: number;
}> {
  const { runAllIntegrations } = await import("@/lib/integrations/runner");
  const summary = await runAllIntegrations({
    trigger: "cron",
    providers: ["google"],
  });
  const googleResults = summary.results.filter(
    (result) => result.provider === "google",
  );
  return {
    synced: googleResults.filter((result) => result.status === "success").length,
    total: googleResults.length,
  };
}
