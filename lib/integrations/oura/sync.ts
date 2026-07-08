import { runIntegrationsForUser } from "@/lib/integrations/runner";

function getOuraRowsUpserted(
  results: Awaited<ReturnType<typeof runIntegrationsForUser>>["results"],
): number {
  const ouraResult = results.find((result) => result.provider === "oura");
  if (!ouraResult) {
    throw new Error("Oura is not connected");
  }
  if (ouraResult.status === "skipped") {
    throw new Error(ouraResult.message);
  }
  if (ouraResult.status === "error") {
    throw new Error(ouraResult.message);
  }
  return (ouraResult.metadata?.rowsUpserted as number | undefined) ?? 0;
}

export async function syncOuraForUserId(userId: string): Promise<number> {
  const summary = await runIntegrationsForUser(userId, {
    trigger: "manual",
    providers: ["oura"],
  });
  return getOuraRowsUpserted(summary.results);
}

export async function syncAllOuraIntegrations(): Promise<{
  synced: number;
  total: number;
}> {
  const { runAllIntegrations } = await import("@/lib/integrations/runner");
  const summary = await runAllIntegrations({ trigger: "cron", providers: ["oura"] });
  const ouraResults = summary.results.filter((result) => result.provider === "oura");
  return {
    synced: ouraResults.filter((result) => result.status === "success").length,
    total: ouraResults.length,
  };
}
