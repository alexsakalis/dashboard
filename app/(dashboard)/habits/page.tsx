import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CreateHabitDialog } from "@/components/habits/CreateHabitDialog";
import { HabitToggleList } from "@/components/habits/HabitToggleList";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getHabits, seedDefaultHabits } from "@/lib/actions/habits";

async function HabitsPageContent() {
  await seedDefaultHabits();
  const habits = await getHabits();

  return (
    <Card>
      <CardContent className="pt-6">
        <HabitToggleList habits={habits} />
      </CardContent>
    </Card>
  );
}

export default function HabitsPage() {
  return (
    <>
      <PageHeader title="Habits" action={<CreateHabitDialog />} />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <HabitsPageContent />
        </Suspense>
      </main>
    </>
  );
}
