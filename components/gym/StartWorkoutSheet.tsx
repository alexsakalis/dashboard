"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { createWorkout, duplicateWorkoutAsNew } from "@/lib/actions/gym";
import { WORKOUT_SPLITS, SPLIT_LABELS } from "@/lib/gym/constants";
import type { LastWorkoutReference, WorkoutSplit } from "@/types/gym";
import { PreviousPerformanceHint } from "@/components/gym/PreviousPerformanceHint";

interface StartWorkoutSheetProps {
  defaultSplit?: WorkoutSplit;
  lastReference?: LastWorkoutReference | null;
  duplicateFromId?: string;
  triggerLabel?: string;
}

export function StartWorkoutSheet({
  defaultSplit,
  lastReference,
  duplicateFromId,
  triggerLabel = "Start",
}: StartWorkoutSheetProps) {
  const [open, setOpen] = useState(false);
  const [split, setSplit] = useState<WorkoutSplit>(defaultSplit ?? "push");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("split", split);

    if (duplicateFromId) {
      startTransition(async () => {
        const workout = await duplicateWorkoutAsNew(duplicateFromId, {
          copySets: true,
          name: formData.get("name") as string,
        });
        setOpen(false);
        router.push(`/gym/${workout.id}`);
      });
      return;
    }

    if (lastReference && formData.get("repeat_last") === "true") {
      formData.set("duplicate_from_workout_id", lastReference.workoutId);
    }

    startTransition(async () => {
      const workout = await createWorkout(formData);
      setOpen(false);
      router.push(`/gym/${workout.id}`);
    });
  }

  const defaultName = `${SPLIT_LABELS[split]} Day`;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button size="sm">
            <Plus className="mr-1 h-4 w-4" />
            {triggerLabel}
          </Button>
        }
      />
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Start workout</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Split</Label>
            <Select
              value={split}
              onValueChange={(v) => setSplit((v ?? "push") as WorkoutSplit)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORKOUT_SPLITS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SPLIT_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Workout name</Label>
            <Input
              id="name"
              name="name"
              required
              defaultValue={defaultName}
              key={defaultName}
            />
          </div>
          {lastReference && !duplicateFromId && (
            <div className="rounded-xl bg-muted/35 p-3 ring-1 ring-border/40">
              <p className="text-xs font-medium text-muted-foreground">
                Last {SPLIT_LABELS[split]} workout
              </p>
              <p className="mt-1 text-sm font-medium">{lastReference.workoutName}</p>
              <ul className="mt-2 space-y-1">
                {lastReference.exercises.slice(0, 4).map((ex) => (
                  <li key={ex.exerciseName} className="text-xs">
                    <span className="font-medium">{ex.exerciseName}</span>
                    {" — "}
                    <PreviousPerformanceHint sets={ex.sets} />
                  </li>
                ))}
              </ul>
              <label className="mt-3 flex items-center gap-2 text-sm">
                <input type="checkbox" name="repeat_last" value="true" defaultChecked />
                Copy exercises from last workout
              </label>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Starting..." : "Start workout"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
