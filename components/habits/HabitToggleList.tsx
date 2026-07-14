"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { toggleHabit, deleteHabit } from "@/lib/actions/habits";
import { EditHabitDialog } from "@/components/habits/EditHabitDialog";
import { HabitStreakDots } from "@/components/habits/HabitStreakDots";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface HabitWithStatus {
  id: string;
  name: string;
  icon: string | null;
  completed_today: boolean;
  streak: number;
  recentCompletions?: string[];
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
        <HabitRow key={habit.id} habit={habit} />
      ))}
    </div>
  );
}

function HabitRow({ habit }: { habit: HabitWithStatus }) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);

  function handleToggle() {
    startTransition(async () => {
      await toggleHabit(habit.id);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteHabit(habit.id);
    });
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border/50 p-3 transition-colors",
          habit.completed_today && "border-primary/30 bg-primary/5",
          isPending && "opacity-50",
        )}
      >
        <button
          type="button"
          onClick={handleToggle}
          disabled={isPending}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="text-lg">{habit.icon ?? "✓"}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{habit.name}</p>
            <HabitStreakDots
              streak={habit.streak}
              recentCompletions={habit.recentCompletions ?? []}
            />
          </div>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-muted-foreground"
                aria-label={`Actions for ${habit.name}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={handleDelete}>
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <EditHabitDialog
        habit={habit}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </>
  );
}
