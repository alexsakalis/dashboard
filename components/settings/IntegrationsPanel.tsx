"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, XCircle, ExternalLink } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  disconnectIntegration,
  syncAllNow,
  syncGoogleCalendarNow,
  syncOuraNow,
} from "@/lib/actions/integrations";
import { IntegrationStatusBadge } from "@/components/integrations/IntegrationStatusBadge";

interface IntegrationSummary {
  id: string;
  provider: string;
  display_name?: string | null;
  config: Record<string, unknown>;
  status: string;
  last_synced_at: string | null;
  last_success_at?: string | null;
  last_message?: string | null;
}

interface IntegrationEnvStatus {
  configLocation: string;
  isProduction: boolean;
  googleOAuth: boolean;
  ouraOAuth: boolean;
  serviceRole: boolean;
  missing: string[];
}

function formatIntegrationError(error: string, oauthBaseUrl: string): string {
  switch (error) {
    case "invalid_state":
      return "OAuth state mismatch. Try connecting again. If it keeps failing, confirm the redirect URI below is registered in your Oura/Google app.";
    case "invalid_request":
      return `Oura/Google rejected the OAuth request (400 invalid_request). Add this exact redirect URI in your provider app settings: ${oauthBaseUrl}/api/oauth/oura/callback (Oura) and ${oauthBaseUrl}/api/oauth/google/callback (Google).`;
    case "redirect_uri_mismatch":
      return `Google redirect URI mismatch. Add ${oauthBaseUrl}/api/oauth/google/callback to your Google Cloud OAuth client.`;
    case "no_refresh_token":
      return "No refresh token received. Disconnect, then reconnect and approve all requested permissions.";
    case "callback_failed":
      return "OAuth callback failed. Check server logs and verify TOKEN_ENCRYPTION_KEY and Supabase service role are configured.";
    default:
      return error;
  }
}

function RedirectUriHint({
  oauthBaseUrl,
  redirectPath,
  configuredAppUrl,
}: {
  oauthBaseUrl: string;
  redirectPath: string;
  configuredAppUrl?: string;
}) {
  const redirectUri = `${oauthBaseUrl}${redirectPath}`;
  const envDiffers =
    configuredAppUrl &&
    configuredAppUrl !== oauthBaseUrl &&
    !oauthBaseUrl.startsWith("http://localhost");

  return (
    <div className="space-y-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-sm">
      <p className="font-medium text-foreground">Register this redirect URI</p>
      <code className="block break-all rounded bg-muted px-2 py-1.5 text-xs">
        {redirectUri}
      </code>
      <p className="text-xs text-muted-foreground">
        OAuth uses the URL you are browsing now, not{" "}
        <code>NEXT_PUBLIC_APP_URL</code>. Add the URI above exactly in your
        Oura/Google app settings.
      </p>
      {envDiffers && (
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <code>NEXT_PUBLIC_APP_URL</code> is set to {configuredAppUrl}, but
          OAuth redirects use {oauthBaseUrl} because that is where you opened the
          app.
        </p>
      )}
    </div>
  );
}

function EnvSetupHint({
  vars,
  envStatus,
  redirectPath,
  oauthBaseUrl,
}: {
  vars: string[];
  envStatus: IntegrationEnvStatus;
  redirectPath: string;
  oauthBaseUrl: string;
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
          {oauthBaseUrl}
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
  oauthBaseUrl,
  configuredAppUrl,
}: {
  integrations: IntegrationSummary[];
  success?: string;
  error?: string;
  ouraOAuthConfigured: boolean;
  googleOAuthConfigured: boolean;
  envStatus: IntegrationEnvStatus;
  oauthBaseUrl: string;
  configuredAppUrl?: string;
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
          <XCircle className="h-4 w-4 shrink-0" />
          Connection failed: {formatIntegrationError(error, oauthBaseUrl)}
        </div>
      )}

      <OuraCard
        integration={oura}
        oauthConfigured={ouraOAuthConfigured}
        envStatus={envStatus}
        oauthBaseUrl={oauthBaseUrl}
        configuredAppUrl={configuredAppUrl}
      />
      <GoogleCard
        integration={google}
        oauthConfigured={googleOAuthConfigured}
        envStatus={envStatus}
        oauthBaseUrl={oauthBaseUrl}
        configuredAppUrl={configuredAppUrl}
      />
      {(oura || google) && <SyncAllButton />}
    </div>
  );
}

function SyncAllButton() {
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSyncAll() {
    setSyncMessage(null);
    startTransition(async () => {
      const result = await syncAllNow();
      if ("error" in result) {
        setSyncMessage(result.error);
      } else {
        const succeeded = result.results.filter((r) => r.status === "success").length;
        setSyncMessage(`Synced ${succeeded} integration(s).`);
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-2 pt-6">
        <Button
          variant="secondary"
          onClick={handleSyncAll}
          disabled={isPending}
          className="w-full"
        >
          {isPending ? "Syncing all..." : "Sync all integrations"}
        </Button>
        {syncMessage && (
          <p className="text-sm text-muted-foreground">{syncMessage}</p>
        )}
      </CardContent>
    </Card>
  );
}

function OuraCard({
  integration,
  oauthConfigured,
  envStatus,
  oauthBaseUrl,
  configuredAppUrl,
}: {
  integration?: IntegrationSummary;
  oauthConfigured: boolean;
  envStatus: IntegrationEnvStatus;
  oauthBaseUrl: string;
  configuredAppUrl?: string;
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
        <IntegrationStatusBadge
          status={integration?.status}
          synced={integration?.last_success_at ?? integration?.last_synced_at}
          message={integration?.last_message}
        />
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
        {oauthConfigured && (
          <RedirectUriHint
            oauthBaseUrl={oauthBaseUrl}
            redirectPath="/api/oauth/oura/callback"
            configuredAppUrl={configuredAppUrl}
          />
        )}
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
              oauthBaseUrl={oauthBaseUrl}
            />
          )
        ) : (
          <div className="space-y-2">
            {integration.status === "reauth_required" && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                {integration.last_message ??
                  "Oura session expired or could not be refreshed."}{" "}
                Reconnect to restore sync.
              </div>
            )}
            {oauthConfigured && integration.status === "reauth_required" ? (
              <a
                href="/api/oauth/oura"
                className={cn(buttonVariants(), "w-full")}
              >
                Reconnect Oura
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            ) : (
              <Button
                variant="secondary"
                onClick={handleSync}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? "Syncing..." : "Sync now"}
              </Button>
            )}
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
  oauthBaseUrl,
  configuredAppUrl,
}: {
  integration?: IntegrationSummary;
  oauthConfigured: boolean;
  envStatus: IntegrationEnvStatus;
  oauthBaseUrl: string;
  configuredAppUrl?: string;
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
        <IntegrationStatusBadge
          status={integration?.status}
          synced={integration?.last_success_at ?? integration?.last_synced_at}
          message={integration?.last_message}
        />
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
        {oauthConfigured && (
          <RedirectUriHint
            oauthBaseUrl={oauthBaseUrl}
            redirectPath="/api/oauth/google/callback"
            configuredAppUrl={configuredAppUrl}
          />
        )}
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
              oauthBaseUrl={oauthBaseUrl}
            />
          )
        ) : (
          <>
            {integration.status === "reauth_required" && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                {integration.last_message ??
                  "Google session expired or could not be refreshed."}{" "}
                Reconnect to restore sync.
              </div>
            )}
            {oauthConfigured && integration.status === "reauth_required" ? (
              <a
                href="/api/oauth/google"
                className={cn(buttonVariants(), "w-full")}
              >
                Reconnect Google
                <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            ) : (
              <Button
                variant="secondary"
                onClick={handleSyncCalendar}
                disabled={isPending}
                className="w-full"
              >
                {isPending ? "Syncing..." : "Sync calendar"}
              </Button>
            )}
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
