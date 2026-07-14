"use client";

import { useState, useTransition } from "react";
import { Check, MoreHorizontal, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { completeTask } from "@/lib/actions/tasks";
import { TaskPriorityDot } from "@/components/dashboard/TasksCard";
import { DeleteTaskDialog } from "@/components/tasks/DeleteTaskDialog";
import { EditTaskDialog } from "@/components/tasks/EditTaskDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Task, TaskCategory } from "@/types";

interface TaskItemProps {
  task: Task & { task_categories?: TaskCategory | null };
  compact?: boolean;
  categories?: TaskCategory[];
}

export function TaskItem({ task, compact, categories = [] }: TaskItemProps) {
  const [isPending, startTransition] = useTransition();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleComplete() {
    startTransition(async () => {
      await completeTask(task.id);
    });
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-border/40 bg-card/40 transition-colors",
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
            {task.recurrence_rule_id && (
              <Repeat
                className="h-3 w-3 shrink-0 text-muted-foreground"
                aria-label="Recurring task"
              />
            )}
          </div>
          {!compact && (task.task_categories || task.description) && (
            <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
              {task.task_categories?.name ?? task.description}
            </p>
          )}
          {compact && task.task_categories && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {task.task_categories.name}
            </p>
          )}
        </div>

        {!compact && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                  aria-label={`Actions for ${task.title}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                Edit task
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setDeleteOpen(true)}
              >
                Delete task
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {!compact && (
        <>
          <EditTaskDialog
            task={task}
            categories={categories}
            open={editOpen}
            onOpenChange={setEditOpen}
          />
          <DeleteTaskDialog
            taskId={task.id}
            taskTitle={task.title}
            open={deleteOpen}
            onOpenChange={setDeleteOpen}
          />
        </>
      )}
    </>
  );
}
