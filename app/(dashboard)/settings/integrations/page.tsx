import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getIntegrations } from "@/lib/actions/integrations";
import { isOuraOAuthConfigured } from "@/lib/integrations/oura/oauth";
import { isGoogleOAuthConfigured } from "@/lib/integrations/google/client";
import { IntegrationsPanel } from "@/components/settings/IntegrationsPanel";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

async function IntegrationsContent({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const params = await searchParams;
  const integrations = await getIntegrations();

  return (
    <IntegrationsPanel
      integrations={integrations}
      success={params.success}
      error={params.error}
      ouraOAuthConfigured={isOuraOAuthConfigured()}
      googleOAuthConfigured={isGoogleOAuthConfigured()}
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
