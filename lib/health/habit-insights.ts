import type { HealthDailySnapshot } from "@/types";

export interface HabitHealthInsight {
  habitId: string;
  habitName: string;
  icon: string | null;
  metric: "sleep_score" | "readiness_score";
  withHabitAvg: number;
  withoutHabitAvg: number;
  delta: number;
  sampleDays: number;
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
}

export function buildHabitHealthInsights(input: {
  habits: Array<{ id: string; name: string; icon: string | null }>;
  completions: Array<{ habit_id: string; completed_date: string }>;
  snapshots: HealthDailySnapshot[];
  days?: number;
}): HabitHealthInsight[] {
  const dates = [...new Set(input.snapshots.map((s) => s.date))].sort();
  if (dates.length < 7) return [];

  const completionSets = new Map<string, Set<string>>();
  for (const habit of input.habits) {
    completionSets.set(habit.id, new Set());
  }
  for (const row of input.completions) {
    completionSets.get(row.habit_id)?.add(row.completed_date);
  }

  const insights: HabitHealthInsight[] = [];

  for (const habit of input.habits) {
    const doneDates = completionSets.get(habit.id) ?? new Set();

    for (const metric of ["sleep_score", "readiness_score"] as const) {
      const withHabit: number[] = [];
      const withoutHabit: number[] = [];

      for (const date of dates) {
        const snapshot = input.snapshots.find((s) => s.date === date);
        const value = snapshot?.[metric];
        if (value == null) continue;

        if (doneDates.has(date)) {
          withHabit.push(value);
        } else {
          withoutHabit.push(value);
        }
      }

      const withAvg = average(withHabit);
      const withoutAvg = average(withoutHabit);

      if (
        withAvg == null ||
        withoutAvg == null ||
        withHabit.length < 3 ||
        withoutHabit.length < 3
      ) {
        continue;
      }

      const delta = withAvg - withoutAvg;
      if (Math.abs(delta) < 5) continue;

      insights.push({
        habitId: habit.id,
        habitName: habit.name,
        icon: habit.icon,
        metric,
        withHabitAvg: withAvg,
        withoutHabitAvg: withoutAvg,
        delta,
        sampleDays: withHabit.length + withoutHabit.length,
      });
    }
  }

  return insights
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 4);
}

export function formatHabitInsight(insight: HabitHealthInsight): string {
  const metricLabel =
    insight.metric === "sleep_score" ? "sleep score" : "readiness";
  const direction = insight.delta > 0 ? "higher" : "lower";
  return `On days you hit ${insight.habitName}, ${metricLabel} averages ${Math.abs(insight.delta)} pts ${direction} (${insight.withHabitAvg} vs ${insight.withoutHabitAvg}).`;
}
