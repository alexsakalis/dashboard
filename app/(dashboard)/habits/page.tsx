import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CreateHabitDialog } from "@/components/habits/CreateHabitDialog";
import { HabitHealthInsights } from "@/components/habits/HabitHealthInsights";
import { HabitToggleList } from "@/components/habits/HabitToggleList";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { Card, CardContent } from "@/components/ui/card";
import { getHabitHealthInsightLines, getHabits, seedDefaultHabits } from "@/lib/actions/habits";

async function HabitsPageContent() {
  await seedDefaultHabits();
  const [habits, insights] = await Promise.all([
    getHabits(),
    getHabitHealthInsightLines(),
  ]);

  const doneToday = habits.filter((habit) => habit.completed_today).length;

  return (
    <div className="space-y-4">
      {habits.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {doneToday}/{habits.length} habits completed today
        </p>
      )}
      <HabitHealthInsights insights={insights} />
      <Card>
        <CardContent className="pt-6">
          <HabitToggleList habits={habits} />
        </CardContent>
      </Card>
    </div>
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
