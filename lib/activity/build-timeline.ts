import { format, subDays } from "date-fns";
import type { ActivityEvent } from "@/lib/activity/types";
import { formatSplit } from "@/lib/gym/format";
import type { WorkoutSplit } from "@/types/gym";

const PROVIDER_LABELS: Record<string, string> = {
  oura: "Oura",
  google: "Google Calendar",
  apple_health: "Apple Health",
};

export function mergeActivityEvents(events: ActivityEvent[]): ActivityEvent[] {
  return [...events].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function groupActivityByDate(
  events: ActivityEvent[],
): Array<{ date: string; label: string; events: ActivityEvent[] }> {
  const groups = new Map<string, ActivityEvent[]>();

  for (const event of events) {
    const date = format(new Date(event.timestamp), "yyyy-MM-dd");
    const bucket = groups.get(date) ?? [];
    bucket.push(event);
    groups.set(date, bucket);
  }

  const today = format(new Date(), "yyyy-MM-dd");
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

  return [...groups.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, dayEvents]) => ({
      date,
      label:
        date === today
          ? "Today"
          : date === yesterday
            ? "Yesterday"
            : format(new Date(`${date}T12:00:00`), "EEEE, MMM d"),
      events: dayEvents,
    }));
}

export function taskToActivity(task: {
  id: string;
  title: string;
  completed_at: string | null;
  points_awarded: number;
}): ActivityEvent | null {
  if (!task.completed_at) return null;
  return {
    id: `task-${task.id}`,
    kind: "task",
    title: task.title,
    subtitle: "Task completed",
    timestamp: task.completed_at,
    href: "/tasks",
    points: task.points_awarded || undefined,
  };
}

export function habitToActivity(habit: {
  id: string;
  name: string;
  icon: string | null;
  completed_date: string;
}): ActivityEvent {
  return {
    id: `habit-${habit.id}-${habit.completed_date}`,
    kind: "habit",
    title: habit.name,
    subtitle: "Habit completed",
    timestamp: `${habit.completed_date}T12:00:00.000Z`,
    href: "/habits",
    emoji: habit.icon ?? undefined,
  };
}

export function workoutToActivity(workout: {
  id: string;
  name: string;
  completed_at: string | null;
  split: string | null;
}): ActivityEvent | null {
  if (!workout.completed_at) return null;
  return {
    id: `workout-${workout.id}`,
    kind: "workout",
    title: workout.name,
    subtitle: workout.split
      ? `${formatSplit(workout.split as WorkoutSplit)} workout`
      : "Workout completed",
    timestamp: workout.completed_at,
    href: `/gym/${workout.id}`,
    emoji: "🏋️",
  };
}

export function syncToActivity(log: {
  id: string;
  provider: string;
  status: string;
  message: string | null;
  finished_at: string | null;
  started_at: string;
}): ActivityEvent | null {
  if (log.status !== "success") return null;
  return {
    id: `sync-${log.id}`,
    kind: "sync",
    title: `${PROVIDER_LABELS[log.provider] ?? log.provider} synced`,
    subtitle: log.message ?? "Integration sync completed",
    timestamp: log.finished_at ?? log.started_at,
    href: "/settings/integrations",
  };
}

export function calendarToActivity(event: {
  id: string;
  title: string;
  start_time: string;
  location: string | null;
}): ActivityEvent {
  return {
    id: `calendar-${event.id}`,
    kind: "calendar",
    title: event.title,
    subtitle: event.location ?? "Calendar event",
    timestamp: event.start_time,
    href: "/calendar",
    emoji: "📅",
  };
}

export function journalToActivity(note: {
  id: string;
  title: string | null;
  updated_at: string;
}): ActivityEvent {
  return {
    id: `journal-${note.id}`,
    kind: "journal",
    title: "Journal entry saved",
    subtitle: note.title
      ? format(new Date(`${note.title}T12:00:00`), "MMM d")
      : "Daily note",
    timestamp: note.updated_at,
    href: "/journal",
    emoji: "📝",
  };
}

export function scoreToActivity(event: {
  id: string;
  event_type: string;
  points: number;
  created_at: string;
}): ActivityEvent {
  const labels: Record<string, string> = {
    streak_bonus: "Streak bonus",
    recurring_bonus: "Recurring task bonus",
    task_complete: "Task points",
    habit_complete: "Habit points",
  };

  return {
    id: `score-${event.id}`,
    kind: "score",
    title: labels[event.event_type] ?? "Score earned",
    subtitle: `+${event.points} points`,
    timestamp: event.created_at,
    points: event.points,
  };
}
