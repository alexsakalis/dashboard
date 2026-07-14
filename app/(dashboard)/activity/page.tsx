import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { getActivityTimeline } from "@/lib/actions/activity";

async function ActivityContent() {
  const { groups } = await getActivityTimeline(14);
  return <ActivityFeed groups={groups} />;
}

export default function ActivityPage() {
  return (
    <>
      <PageHeader
        title="Activity"
        subtitle="Tasks, habits, workouts & syncs"
      />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <ActivityContent />
        </Suspense>
      </main>
    </>
  );
}
