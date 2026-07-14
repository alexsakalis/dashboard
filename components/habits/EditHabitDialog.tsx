"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateHabit } from "@/lib/actions/habits";

export function EditHabitDialog({
  habit,
  open,
  onOpenChange,
}: {
  habit: { id: string; name: string; icon: string | null };
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      await updateHabit(habit.id, {
        name: formData.get("name") as string,
        icon: (formData.get("icon") as string) || null,
      });
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`habit-name-${habit.id}`}>Name</Label>
            <Input
              id={`habit-name-${habit.id}`}
              name="name"
              required
              defaultValue={habit.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`habit-icon-${habit.id}`}>Icon (emoji)</Label>
            <Input
              id={`habit-icon-${habit.id}`}
              name="icon"
              defaultValue={habit.icon ?? ""}
              maxLength={4}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving..." : "Save changes"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
