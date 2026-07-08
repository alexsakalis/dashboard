import Link from "next/link";
import { ArrowRight, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IntegrationStatusBadge } from "@/components/integrations/IntegrationStatusBadge";
import type { DashboardSummary } from "@/types";

export function SyncStatusCard({ summary }: { summary: DashboardSummary }) {
  const integrations = summary.card_data.integrations_status;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-medium">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          Sync Status
        </CardTitle>
        <Link
          href="/settings/integrations"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Manage <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {integrations.length === 0 ? (
          <p className="py-2 text-center text-sm text-muted-foreground">
            No integrations connected yet.
          </p>
        ) : (
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.provider}
                className="flex items-start justify-between gap-3 rounded-lg border border-border/40 p-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    {integration.display_name}
                  </p>
                  {integration.duration_ms != null && (
                    <p className="text-xs text-muted-foreground">
                      Last run: {integration.duration_ms}ms
                    </p>
                  )}
                  {integration.last_sync_at && (
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(integration.last_sync_at), {
                        addSuffix: true,
                      })}
                    </p>
                  )}
                </div>
                <IntegrationStatusBadge
                  status={integration.status}
                  synced={integration.last_sync_at}
                  message={integration.last_message}
                />
              </div>
            ))}
          </div>
        )}
        {summary.last_sync && (
          <p className="mt-3 text-xs text-muted-foreground">
            Last successful sync{" "}
            {formatDistanceToNow(new Date(summary.last_sync), {
              addSuffix: true,
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
