"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createWorkout } from "@/lib/actions/gym";

export function CreateWorkoutDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const workout = await createWorkout(formData);
      setOpen(false);
      router.push(`/gym/${workout.id}`);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Log
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Workout</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Workout name</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. Chest Day"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="workout_type">Type</Label>
            <Input
              id="workout_type"
              name="workout_type"
              placeholder="push, pull, legs..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="muscle_groups">Muscle groups (comma-separated)</Label>
            <Input
              id="muscle_groups"
              name="muscle_groups"
              placeholder="chest, triceps"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Starting..." : "Start Workout"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
