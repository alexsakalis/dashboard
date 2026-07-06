import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { HabitsCard } from "@/components/dashboard/HabitsCard";
import { CreateHabitDialog } from "@/components/habits/CreateHabitDialog";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

export default function HabitsPage() {
  return (
    <>
      <PageHeader title="Habits" action={<CreateHabitDialog />} />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <HabitsCard />
        </Suspense>
      </main>
    </>
  );
}
