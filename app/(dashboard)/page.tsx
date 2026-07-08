import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { DailyScoreCard } from "@/components/dashboard/DailyScoreCard";
import { FinanceCard } from "@/components/dashboard/FinanceCard";
import { GymSummaryCard } from "@/components/dashboard/GymSummaryCard";
import { HabitsCard } from "@/components/dashboard/HabitsCard";
import { HealthCard } from "@/components/dashboard/HealthCard";
import { SyncStatusCard } from "@/components/dashboard/SyncStatusCard";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { getDashboardSummary, refreshDashboardSummaryForCurrentUser } from "@/lib/actions/dashboard";
import { seedDefaultHabits } from "@/lib/actions/habits";

async function DashboardContent() {
  const seeded = await seedDefaultHabits();
  if (seeded) {
    await refreshDashboardSummaryForCurrentUser();
  }
  const summary = await getDashboardSummary();

  return (
    <>
      <DailyScoreCard summary={summary} />
      <TasksCard summary={summary} />
      <HabitsCard summary={summary} />
      <HealthCard summary={summary} />
      <GymSummaryCard summary={summary} />
      <FinanceCard summary={summary} />
      <CalendarCard summary={summary} />
      <SyncStatusCard summary={summary} />
    </>
  );
}

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
        <Suspense
          fallback={
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          }
        >
          <DashboardContent />
        </Suspense>
      </main>
    </>
  );
}
