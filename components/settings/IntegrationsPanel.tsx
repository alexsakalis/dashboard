"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  disconnectIntegration,
  syncOuraNow,
  syncGoogleCalendarNow,
} from "@/lib/actions/integrations";

interface IntegrationSummary {
  id: string;
  provider: string;
  config: Record<string, unknown>;
  status: string;
  last_synced_at: string | null;
}

interface IntegrationEnvStatus {
  configLocation: string;
  isProduction: boolean;
  googleOAuth: boolean;
  ouraOAuth: boolean;
  serviceRole: boolean;
  missing: string[];
}

function EnvSetupHint({
  vars,
  envStatus,
  redirectPath,
  appUrl,
}: {
  vars: string[];
  envStatus: IntegrationEnvStatus;
  redirectPath: string;
  appUrl: string;
}) {
  const missing = vars.filter((name) => envStatus.missing.includes(name));

  return (
    <div className="space-y-2 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
      {missing.length > 0 ? (
        <p>
          Add{" "}
          {missing.map((name, index) => (
            <span key={name}>
              <code className="text-xs">{name}</code>
              {index < missing.length - 1 ? ", " : " "}
            </span>
          ))}
          to <code className="text-xs">{envStatus.configLocation}</code>.
        </p>
      ) : (
        <p>
          OAuth credentials are not available in this deployment. Add them to{" "}
          <code className="text-xs">{envStatus.configLocation}</code>.
        </p>
      )}
      {!envStatus.serviceRole && (
        <p>
          Oura sync also requires{" "}
          <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code>.
        </p>
      )}
      <p>
        Redirect URI:{" "}
        <code className="break-all text-xs">
          {appUrl}
          {redirectPath}
        </code>
      </p>
    </div>
  );
}

export function IntegrationsPanel({
  integrations,
  success,
  error,
  ouraOAuthConfigured,
  googleOAuthConfigured,
  envStatus,
  appUrl,
}: {
  integrations: IntegrationSummary[];
  success?: string;
  error?: string;
  ouraOAuthConfigured: boolean;
  googleOAuthConfigured: boolean;
  envStatus: IntegrationEnvStatus;
  appUrl: string;
}) {
  const oura = integrations.find((i) => i.provider === "oura");
  const google = integrations.find((i) => i.provider === "google");

  return (
    <div className="space-y-4">
      {success === "google" && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Google connected and calendar synced.
        </div>
      )}
      {success === "oura" && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          Oura connected and synced.
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <XCircle className="h-4 w-4" />
          Connection failed: {error}
        </div>
      )}

      <OuraCard
        integration={oura}
        oauthConfigured={ouraOAuthConfigured}
        envStatus={envStatus}
        appUrl={appUrl}
      />
      <GoogleCard
        integration={google}
        oauthConfigured={googleOAuthConfigured}
        envStatus={envStatus}
        appUrl={appUrl}
      />
    </div>
  );
}

function OuraCard({
  integration,
  oauthConfigured,
  envStatus,
  appUrl,
}: {
  integration?: IntegrationSummary;
  oauthConfigured: boolean;
  envStatus: IntegrationEnvStatus;
  appUrl: string;
}) {
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDisconnect() {
    startTransition(async () => {
      await disconnectIntegration("oura");
    });
  }

  function handleSync() {
    setSyncMessage(null);
    startTransition(async () => {
      const result = await syncOuraNow();
      if ("error" in result) {
        setSyncMessage(result.error);
      } else {
        setSyncMessage(`Synced ${result.days} day(s) of data.`);
      }
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
          Connect via Oura OAuth. Create an app at{" "}
          <a
            href="https://cloud.ouraring.com/oauth/applications"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Oura Cloud → API Applications
          </a>{" "}
          and add your Client ID + Secret to your deployment environment
          variables.
        </p>
        {!integration ? (
          oauthConfigured ? (
            <a
              href="/api/oauth/oura"
              className={cn(buttonVariants(), "w-full")}
            >
              Connect Oura
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          ) : (
            <EnvSetupHint
              vars={["OURA_CLIENT_ID", "OURA_CLIENT_SECRET"]}
              envStatus={envStatus}
              redirectPath="/api/oauth/oura/callback"
              appUrl={appUrl}
            />
          )
        ) : (
          <div className="space-y-2">
            <Button
              variant="secondary"
              onClick={handleSync}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? "Syncing..." : "Sync now"}
            </Button>
            {syncMessage && (
              <p className="text-sm text-muted-foreground">{syncMessage}</p>
            )}
            <Button variant="outline" onClick={handleDisconnect} disabled={isPending}>
              Disconnect
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GoogleCard({
  integration,
  oauthConfigured,
  envStatus,
  appUrl,
}: {
  integration?: IntegrationSummary;
  oauthConfigured: boolean;
  envStatus: IntegrationEnvStatus;
  appUrl: string;
}) {
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSyncCalendar() {
    setSyncMessage(null);
    startTransition(async () => {
      const result = await syncGoogleCalendarNow();
      if ("error" in result) {
        setSyncMessage(result.error);
      } else {
        setSyncMessage(`Synced ${result.events} calendar event(s).`);
      }
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
        <CardTitle className="text-base">Google Calendar</CardTitle>
        <StatusBadge status={integration?.status} synced={integration?.last_synced_at} />
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Connect for calendar events. Create OAuth credentials in{" "}
          <a
            href="https://console.cloud.google.com/apis/credentials"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            Google Cloud Console
          </a>{" "}
          and add your Client ID + Secret to your deployment environment
          variables.
        </p>
        {!integration ? (
          oauthConfigured ? (
            <a
              href="/api/oauth/google"
              className={cn(buttonVariants(), "w-full")}
            >
              Connect Google
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          ) : (
            <EnvSetupHint
              vars={["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]}
              envStatus={envStatus}
              redirectPath="/api/oauth/google/callback"
              appUrl={appUrl}
            />
          )
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={handleSyncCalendar}
              disabled={isPending}
              className="w-full"
            >
              {isPending ? "Syncing..." : "Sync calendar"}
            </Button>
            {syncMessage && (
              <p className="text-sm text-muted-foreground">{syncMessage}</p>
            )}
            <Button variant="outline" onClick={handleDisconnect} disabled={isPending}>
              Disconnect
            </Button>
          </>
        )}
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
