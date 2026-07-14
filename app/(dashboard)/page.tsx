import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CalendarCard } from "@/components/dashboard/CalendarCard";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { DailyBriefingCard } from "@/components/dashboard/DailyBriefingCard";
import { DailyScoreCard } from "@/components/dashboard/DailyScoreCard";
import { FinanceCard } from "@/components/dashboard/FinanceCard";
import { GymSummaryCard } from "@/components/dashboard/GymSummaryCard";
import { HabitsCard } from "@/components/dashboard/HabitsCard";
import { HealthCard } from "@/components/dashboard/HealthCard";
import { SyncStatusCard } from "@/components/dashboard/SyncStatusCard";
import { TasksCard } from "@/components/dashboard/TasksCard";
import { requireUser } from "@/lib/auth";
import { getDashboardSummary, getHealthSnapshots, refreshDashboardSummaryForCurrentUser } from "@/lib/actions/dashboard";
import { seedDefaultHabits } from "@/lib/actions/habits";
import { processRecurringTasksForCurrentUser } from "@/lib/actions/tasks";

async function DashboardContent() {
  const seeded = await seedDefaultHabits();
  const recurringCreated = await processRecurringTasksForCurrentUser();
  if (seeded || recurringCreated > 0) {
    await refreshDashboardSummaryForCurrentUser();
  }
  const summary = await getDashboardSummary();
  const healthSnapshots = await getHealthSnapshots(7);

  return (
    <>
      <DailyScoreCard summary={summary} />
      <DailyBriefingCard summary={summary} />
      <TasksCard summary={summary} />
      <HabitsCard summary={summary} />
      <HealthCard summary={summary} snapshots={healthSnapshots} />
      <GymSummaryCard summary={summary} snapshots={healthSnapshots} />
      <FinanceCard summary={summary} />
      <CalendarCard summary={summary} />
      <SyncStatusCard summary={summary} />
    </>
  );
}

export default async function HomePage() {
  await requireUser();

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
