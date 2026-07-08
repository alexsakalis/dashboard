import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitToggleList } from "@/components/habits/HabitToggleList";
import type { DashboardSummary } from "@/types";

export function HabitsCard({ summary }: { summary: DashboardSummary }) {
  const habits = summary.card_data.habits_preview;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Habits</CardTitle>
        <Link
          href="/habits"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Manage <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <HabitToggleList habits={habits} />
      </CardContent>
    </Card>
  );
}
