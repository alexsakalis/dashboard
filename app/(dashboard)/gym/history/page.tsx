import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { getWorkouts } from "@/lib/actions/gym";
import {
  WorkoutHistoryList,
} from "@/components/gym/WorkoutHistoryList";
import { WorkoutHistoryFiltersWrapper } from "@/components/gym/WorkoutHistoryFiltersWrapper";
import type { WorkoutSplit } from "@/types/gym";

async function HistoryContent({
  split,
}: {
  split?: WorkoutSplit;
}) {
  const workouts = await getWorkouts({
    limit: 50,
    split,
    completedOnly: false,
  });

  return <WorkoutHistoryList workouts={workouts} />;
}

export default async function GymHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ split?: string }>;
}) {
  const params = await searchParams;
  const split = params.split as WorkoutSplit | undefined;

  return (
    <>
      <PageHeader title="Workout History" subtitle="Browse past sessions" />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <WorkoutHistoryFiltersWrapper>
            <HistoryContent split={split} />
          </WorkoutHistoryFiltersWrapper>
        </Suspense>
      </main>
    </>
  );
}
