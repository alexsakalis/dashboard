"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  updateWorkoutSet,
  deleteWorkoutSet,
  duplicateSet,
} from "@/lib/actions/gym";
import type { WorkoutSet } from "@/types/gym";
import { cn } from "@/lib/utils";

interface SetRowProps {
  set: WorkoutSet;
  workoutId: string;
  isActive: boolean;
}

export function SetRow({ set, workoutId, isActive }: SetRowProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function save(field: string, value: string | boolean) {
    if (!isActive) return;
    const formData = new FormData();
    formData.set("set_id", set.id);
    formData.set("workout_id", workoutId);
    formData.set("reps", String(set.reps ?? ""));
    formData.set("weight", String(set.weight ?? ""));
    formData.set("rpe", String(set.rpe ?? ""));
    formData.set("is_warmup", set.is_warmup ? "true" : "false");
    formData.set(field, String(value));

    startTransition(async () => {
      await updateWorkoutSet(formData);
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteWorkoutSet(set.id, workoutId);
      router.refresh();
    });
  }

  function handleDuplicate() {
    startTransition(async () => {
      await duplicateSet(set.id, workoutId);
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "grid grid-cols-[2rem_1fr_1fr_1fr_auto] items-center gap-2 py-1.5",
        isPending && "opacity-60",
        set.is_warmup && "opacity-70",
      )}
    >
      <span className="text-xs text-muted-foreground tabular-nums">
        {set.set_number}
      </span>
      {isActive ? (
        <>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step={0.5}
            defaultValue={set.weight ?? ""}
            placeholder="lbs"
            className="h-8 text-sm tabular-nums"
            onBlur={(e) => save("weight", e.target.value)}
          />
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            defaultValue={set.reps ?? ""}
            placeholder="reps"
            className="h-8 text-sm tabular-nums"
            onBlur={(e) => save("reps", e.target.value)}
          />
          <Input
            type="number"
            inputMode="decimal"
            min={1}
            max={10}
            step={0.5}
            defaultValue={set.rpe ?? ""}
            placeholder="RPE"
            className="h-8 text-sm tabular-nums"
            onBlur={(e) => save("rpe", e.target.value)}
          />
          <div className="flex items-center gap-1">
            <Checkbox
              checked={set.is_warmup}
              onCheckedChange={(checked) =>
                save("is_warmup", checked === true ? "true" : "false")
              }
              aria-label="Warm-up set"
            />
            <button
              type="button"
              onClick={handleDuplicate}
              className="rounded p-1 text-muted-foreground hover:text-foreground"
              aria-label="Duplicate set"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded p-1 text-muted-foreground hover:text-destructive"
              aria-label="Delete set"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </>
      ) : (
        <>
          <span className="text-sm tabular-nums">{set.weight ?? "—"}</span>
          <span className="text-sm tabular-nums">{set.reps ?? "—"}</span>
          <span className="text-sm tabular-nums text-muted-foreground">
            {set.rpe ? `@${set.rpe}` : "—"}
          </span>
          <span className="text-xs text-muted-foreground">
            {set.is_warmup ? "W" : ""}
          </span>
        </>
      )}
    </div>
  );
}

export function SetRowHeader() {
  return (
    <div className="grid grid-cols-[2rem_1fr_1fr_1fr_auto] gap-2 px-0 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
      <span>#</span>
      <span>Weight</span>
      <span>Reps</span>
      <span>RPE</span>
      <span className="sr-only">Actions</span>
    </div>
  );
}
