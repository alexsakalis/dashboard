"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  saveOuraToken,
  saveSpreadsheetConfig,
  disconnectIntegration,
} from "@/lib/actions/integrations";

interface IntegrationSummary {
  id: string;
  provider: string;
  config: Record<string, unknown>;
  status: string;
  last_synced_at: string | null;
}

export function IntegrationsPanel({
  integrations,
  success,
  error,
}: {
  integrations: IntegrationSummary[];
  success?: string;
  error?: string;
}) {
  const oura = integrations.find((i) => i.provider === "oura");
  const google = integrations.find((i) => i.provider === "google");
  const appleHealth = integrations.find((i) => i.provider === "apple_health");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const healthSyncUrl = `${appUrl}/api/health/sync`;

  return (
    <div className="space-y-4">
      {success === "google" && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Google connected successfully.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4" />
          Connection failed: {error}
        </div>
      )}

      <OuraCard integration={oura} />
      <GoogleCard integration={google} />
      <AppleHealthCard
        integration={appleHealth}
        syncUrl={healthSyncUrl}
      />
    </div>
  );
}

function OuraCard({ integration }: { integration?: IntegrationSummary }) {
  const [token, setToken] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      await saveOuraToken(token);
      setToken("");
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectIntegration("oura");
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Oura Ring</CardTitle>
        <StatusBadge status={integration?.status} synced={integration?.last_synced_at} />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Paste your Personal Access Token from{" "}
          <a
            href="https://cloud.ouraring.com/personal-access-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Oura Cloud
          </a>
          .
        </p>
        {!integration ? (
          <>
            <Input
              type="password"
              placeholder="Oura PAT"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
            <Button onClick={handleSave} disabled={!token || isPending} className="w-full">
              {isPending ? "Saving..." : "Connect Oura"}
            </Button>
          </>
        ) : (
          <Button variant="outline" onClick={handleDisconnect} disabled={isPending}>
            Disconnect
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function GoogleCard({ integration }: { integration?: IntegrationSummary }) {
  const [spreadsheetId, setSpreadsheetId] = useState(
    (integration?.config?.spreadsheet_id as string) ?? "",
  );
  const [isPending, startTransition] = useTransition();

  function handleSaveSpreadsheet() {
    startTransition(async () => {
      await saveSpreadsheetConfig(spreadsheetId);
    });
  }

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectIntegration("google");
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Google (Sheets + Calendar)</CardTitle>
        <StatusBadge status={integration?.status} synced={integration?.last_synced_at} />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Connect for finance sync and calendar events. Sync iCloud Calendar to
          Google on your iPhone for Apple Calendar support.
        </p>
        {!integration ? (
          <Link
            href="/api/oauth/google"
            className={cn(buttonVariants(), "w-full")}
          >
            Connect Google
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="spreadsheet_id">Spreadsheet ID</Label>
              <Input
                id="spreadsheet_id"
                placeholder="From Google Sheets URL"
                value={spreadsheetId}
                onChange={(e) => setSpreadsheetId(e.target.value)}
              />
              <Button
                onClick={handleSaveSpreadsheet}
                disabled={!spreadsheetId || isPending}
                variant="secondary"
                className="w-full"
              >
                Save Spreadsheet
              </Button>
            </div>
            <Button variant="outline" onClick={handleDisconnect} disabled={isPending}>
              Disconnect
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function AppleHealthCard({
  integration,
  syncUrl,
}: {
  integration?: IntegrationSummary;
  syncUrl: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Apple Health</CardTitle>
        <StatusBadge status={integration?.status} synced={integration?.last_synced_at} />
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Use{" "}
          <a
            href="https://apps.apple.com/us/app/health-auto-export-json-csv/id1115567069"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Health Auto Export
          </a>{" "}
          (Premium) to POST data to this webhook:
        </p>
        <div className="rounded-lg bg-muted p-3 font-mono text-xs break-all">
          {syncUrl}
        </div>
        <p className="text-muted-foreground">
          Set Authorization header:{" "}
          <code className="rounded bg-muted px-1">Bearer YOUR_HEALTH_SYNC_API_KEY</code>
        </p>
        <p className="text-xs text-muted-foreground">
          Configure <code>HEALTH_SYNC_API_KEY</code> and{" "}
          <code>HEALTH_SYNC_USER_ID</code> in your environment variables.
        </p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({
  status,
  synced,
}: {
  status?: string;
  synced?: string | null;
}) {
  if (!status) {
    return <Badge variant="secondary">Not connected</Badge>;
  }

  return (
    <div className="text-right">
      <Badge variant={status === "active" ? "default" : "destructive"}>
        {status}
      </Badge>
      {synced && (
        <p className="mt-1 text-xs text-muted-foreground">
          Synced {new Date(synced).toLocaleString()}
        </p>
      )}
    </div>
  );
}
