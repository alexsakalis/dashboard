import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { DailyScoreCard } from "@/components/dashboard/DailyScoreCard";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { HabitsCard } from "@/components/dashboard/HabitsCard";
import { HealthCard } from "@/components/dashboard/HealthCard";
import { GymSummaryCard } from "@/components/dashboard/GymSummaryCard";
import { FinanceCard } from "@/components/dashboard/FinanceCard";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

export default function HomePage() {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      <PageHeader title="Command Center" subtitle={today} />
      <main className="space-y-4 px-4 py-5">
        <Suspense fallback={<CardSkeleton />}>
          <DailyScoreCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <TasksCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <HabitsCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <HealthCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <GymSummaryCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <FinanceCard />
        </Suspense>
        <Suspense fallback={<CardSkeleton />}>
          <CalendarCard />
        </Suspense>
      </main>
    </>
  );
}
