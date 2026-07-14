"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TaskFormFields,
  taskToFormValues,
  type TaskFormValues,
} from "@/components/tasks/TaskFormFields";
import { updateTask } from "@/lib/actions/tasks";
import type { Task, TaskCategory } from "@/types";

interface EditTaskDialogProps {
  task: Task & { task_categories?: TaskCategory | null };
  categories: TaskCategory[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTaskDialog({
  task,
  categories,
  open,
  onOpenChange,
}: EditTaskDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState<TaskFormValues>(() =>
    taskToFormValues(task),
  );

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setValues(taskToFormValues(task));
    }
    onOpenChange(nextOpen);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      await updateTask(task.id, {
        title: values.title.trim(),
        description: values.description.trim() || null,
        priority: values.priority,
        due_date: values.dueDate || null,
        category_id: values.categoryId || null,
      });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TaskFormFields
            values={values}
            onChange={(updates) =>
              setValues((current) => ({ ...current, ...updates }))
            }
            categories={categories}
            showRecurring={false}
            idPrefix={`edit-${task.id}`}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
