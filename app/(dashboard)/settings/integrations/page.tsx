import { Suspense } from "react";
import { headers } from "next/headers";
import { PageHeader } from "@/components/layout/PageHeader";
import { getIntegrations } from "@/lib/actions/integrations";
import { isOuraOAuthConfigured } from "@/lib/integrations/oura/oauth";
import { isGoogleOAuthConfigured } from "@/lib/integrations/google/client";
import {
  getIntegrationEnvStatus,
  getOAuthRedirectBaseUrl,
  tryGetConfiguredAppUrl,
} from "@/lib/env";
import { IntegrationsPanel } from "@/components/settings/IntegrationsPanel";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

async function resolveOAuthContext(): Promise<{
  oauthBaseUrl: string;
  configuredAppUrl?: string;
}> {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const configuredAppUrl = tryGetConfiguredAppUrl();

  if (!host) {
    return {
      oauthBaseUrl: getOAuthRedirectBaseUrl(),
      configuredAppUrl,
    };
  }

  const proto =
    headersList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");

  const request = new Request(
    `${proto}://${host.split(",")[0]?.trim()}/settings/integrations`,
  );

  return {
    oauthBaseUrl: getOAuthRedirectBaseUrl(request),
    configuredAppUrl,
  };
}

async function IntegrationsContent({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const integrations = await getIntegrations();
  const envStatus = getIntegrationEnvStatus();
  const { oauthBaseUrl, configuredAppUrl } = await resolveOAuthContext();

  return (
    <IntegrationsPanel
      integrations={integrations}
      success={params.success}
      error={params.error}
      ouraOAuthConfigured={isOuraOAuthConfigured()}
      googleOAuthConfigured={isGoogleOAuthConfigured()}
      envStatus={envStatus}
      oauthBaseUrl={oauthBaseUrl}
      configuredAppUrl={configuredAppUrl}
    />
  );
}

export default function IntegrationsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  return (
    <>
      <PageHeader title="Integrations" subtitle="Connect your data sources" />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <IntegrationsContent searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
