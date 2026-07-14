import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { GymAnalyticsView } from "@/components/gym/GymAnalyticsView";
import { RecoveryInsightsCard } from "@/components/gym/RecoveryInsightsCard";
import { getGymAnalytics } from "@/lib/actions/gym";

async function AnalyticsContent() {
  const analytics = await getGymAnalytics();
  return (
    <div className="space-y-5">
      <RecoveryInsightsCard insights={analytics.recoveryInsights} />
      <GymAnalyticsView analytics={analytics} />
    </div>
  );
}

export default function GymAnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" subtitle="Volume and muscle-group trends" />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <AnalyticsContent />
        </Suspense>
      </main>
    </>
  );
}
