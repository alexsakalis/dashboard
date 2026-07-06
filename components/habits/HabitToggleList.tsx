"use client";

import { useTransition } from "react";
import { Check, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleHabit } from "@/lib/actions/habits";

interface HabitWithStatus {
  id: string;
  name: string;
  icon: string | null;
  completed_today: boolean;
  streak: number;
}

export function HabitToggleList({ habits }: { habits: HabitWithStatus[] }) {
  if (habits.length === 0) {
    return (
      <p className="py-2 text-center text-sm text-muted-foreground">
        No habits yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {habits.map((habit) => (
        <HabitToggle key={habit.id} habit={habit} />
      ))}
    </div>
  );
}

function HabitToggle({ habit }: { habit: HabitWithStatus }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    startTransition(async () => {
      await toggleHabit(habit.id);
    });
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border border-border/50 p-3 text-left transition-colors hover:bg-muted/50",
        habit.completed_today && "border-primary/30 bg-primary/5",
        isPending && "opacity-50",
      )}
    >
      <span className="text-lg">{habit.icon ?? "✓"}</span>
      <span className="flex-1 text-sm font-medium">{habit.name}</span>
      {habit.streak > 0 && (
        <span className="flex items-center gap-1 text-xs text-orange-500">
          <Flame className="h-3.5 w-3.5" />
          {habit.streak}
        </span>
      )}
      <span
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full border-2",
          habit.completed_today
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30",
        )}
      >
        {habit.completed_today && <Check className="h-3.5 w-3.5" />}
      </span>
    </button>
  );
}
