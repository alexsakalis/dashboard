"use client";

import { useTransition } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { completeTask } from "@/lib/actions/tasks";
import { TaskPriorityDot } from "@/components/dashboard/TasksCard";
import type { Task } from "@/types";

interface TaskItemProps {
  task: Task & { task_categories?: { name: string; color: string } | null };
  compact?: boolean;
}

export function TaskItem({ task, compact }: TaskItemProps) {
  const [isPending, startTransition] = useTransition();

  function handleComplete() {
    startTransition(async () => {
      await completeTask(task.id);
    });
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 p-3 transition-colors",
        isPending && "opacity-50",
        compact ? "p-2.5" : "p-3",
      )}
    >
      <button
        type="button"
        onClick={handleComplete}
        disabled={isPending || task.status === "done"}
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          task.status === "done"
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30 hover:border-primary",
        )}
        aria-label={`Complete ${task.title}`}
      >
        {task.status === "done" && <Check className="h-3.5 w-3.5" />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TaskPriorityDot priority={task.priority} />
          <p
            className={cn(
              "truncate text-sm font-medium",
              task.status === "done" && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>
        </div>
        {!compact && task.task_categories && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {task.task_categories.name}
          </p>
        )}
      </div>
    </div>
  );
}
