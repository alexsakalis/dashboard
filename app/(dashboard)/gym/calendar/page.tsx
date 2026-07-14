import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { WorkoutCalendar } from "@/components/gym/WorkoutCalendar";
import { getWorkoutCalendar } from "@/lib/actions/gym";

async function CalendarContent({ month }: { month?: string }) {
  const calendar = await getWorkoutCalendar(month);
  return <WorkoutCalendar calendar={calendar} />;
}

export default async function GymCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <PageHeader title="Calendar" subtitle="Workouts by day" />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <CalendarContent month={params.month} />
        </Suspense>
      </main>
    </>
  );
}
