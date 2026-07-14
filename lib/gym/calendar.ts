import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { enrichWorkout } from "@/lib/gym/enrich";
import type { Workout, WorkoutSplit } from "@/types/gym";

export interface CalendarDayWorkout {
  id: string;
  name: string;
  split: WorkoutSplit | null;
  startedAt: string;
  completed: boolean;
  durationMinutes: number | null;
  workingSets: number;
}

export interface CalendarMonthDay {
  date: string;
  inMonth: boolean;
  isToday: boolean;
  workouts: CalendarDayWorkout[];
}

export interface WorkoutCalendarMonth {
  monthKey: string;
  label: string;
  days: CalendarMonthDay[];
  workoutCount: number;
  completedCount: number;
}

function workoutDate(workout: Workout): string {
  const raw = workout.completed_at ?? workout.started_at;
  return format(parseISO(raw), "yyyy-MM-dd");
}

export function buildWorkoutCalendarMonth(
  workouts: Workout[],
  month: Date,
): WorkoutCalendarMonth {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const byDate = new Map<string, CalendarDayWorkout[]>();
  for (const workout of workouts) {
    const dateKey = workoutDate(workout);
    const enriched = enrichWorkout(workout);
    const entry: CalendarDayWorkout = {
      id: workout.id,
      name: workout.name,
      split: workout.split,
      startedAt: workout.started_at,
      completed: Boolean(workout.completed_at),
      durationMinutes:
        workout.duration_seconds != null
          ? Math.round(workout.duration_seconds / 60)
          : enriched.duration_seconds != null
            ? Math.round(enriched.duration_seconds / 60)
            : null,
      workingSets: enriched.workingSets,
    };
    const list = byDate.get(dateKey) ?? [];
    list.push(entry);
    byDate.set(dateKey, list);
  }

  const today = new Date();
  const days: CalendarMonthDay[] = [];
  let cursor = gridStart;

  while (cursor <= gridEnd) {
    const dateKey = format(cursor, "yyyy-MM-dd");
    days.push({
      date: dateKey,
      inMonth: isSameMonth(cursor, month),
      isToday: isSameDay(cursor, today),
      workouts: byDate.get(dateKey) ?? [],
    });
    cursor = addDays(cursor, 1);
  }

  const inMonthWorkouts = workouts.filter((w) =>
    isSameMonth(parseISO(workoutDate(w)), month),
  );

  return {
    monthKey: format(month, "yyyy-MM"),
    label: format(month, "MMMM yyyy"),
    days,
    workoutCount: inMonthWorkouts.length,
    completedCount: inMonthWorkouts.filter((w) => w.completed_at).length,
  };
}

export function parseMonthKey(monthKey: string | undefined): Date {
  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
    return parseISO(`${monthKey}-01T12:00:00`);
  }
  return new Date();
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const base = parseISO(`${monthKey}-01T12:00:00`);
  return format(addMonths(base, delta), "yyyy-MM");
}
