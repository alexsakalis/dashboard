"use client";

import { type RefObject, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, StickyNote, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  updateWorkoutSet,
  deleteWorkoutSet,
  duplicateSet,
} from "@/lib/actions/gym";
import { useWorkoutSession } from "@/components/gym/WorkoutSessionProvider";
import { detectPRsFromSets } from "@/lib/gym/progress";
import type { WorkoutSet } from "@/types/gym";
import { cn } from "@/lib/utils";

interface SetRowProps {
  set: WorkoutSet;
  workoutId: string;
  exerciseName: string;
  isActive: boolean;
  sessionActive?: boolean;
  weightUnit?: string;
}

function shouldStartRestTimer(
  weightValue: string,
  repsValue: string,
  isWarmup: boolean,
): boolean {
  if (isWarmup) return false;
  const weight = Number.parseFloat(weightValue);
  const reps = Number.parseInt(repsValue, 10);
  return (
    Number.isFinite(weight) &&
    weight >= 0 &&
    Number.isFinite(reps) &&
    reps > 0
  );
}

export function SetRow({
  set,
  workoutId,
  exerciseName,
  isActive,
  sessionActive = false,
  weightUnit = "lbs",
}: SetRowProps) {
  const [isPending, startTransition] = useTransition();
  const [showNotes, setShowNotes] = useState(Boolean(set.notes));
  const router = useRouter();
  const { startRestTimer, celebratePr, existingPRs } = useWorkoutSession();
  const weightRef = useRef<HTMLInputElement>(null);
  const repsRef = useRef<HTMLInputElement>(null);
  const rpeRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLInputElement>(null);
  const isWarmupRef = useRef(set.is_warmup);

  function currentInputValue(
    ref: RefObject<HTMLInputElement | null>,
    fallback: string | number | null,
  ) {
    return ref.current?.value ?? String(fallback ?? "");
  }

  function save(field: string, value: string | boolean) {
    if (!isActive) return;
    if (field === "is_warmup") {
      isWarmupRef.current = value === true || value === "true";
    }

    const formData = new FormData();
    formData.set("set_id", set.id);
    formData.set("workout_id", workoutId);
    formData.set("reps", currentInputValue(repsRef, set.reps));
    formData.set("weight", currentInputValue(weightRef, set.weight));
    formData.set("rpe", currentInputValue(rpeRef, set.rpe));
    formData.set("is_warmup", isWarmupRef.current ? "true" : "false");
    formData.set("notes", currentInputValue(notesRef, set.notes));
    formData.set(field, String(value));

    startTransition(async () => {
      await updateWorkoutSet(formData);
      router.refresh();
    });
  }

  function checkForPr(weightValue: string, repsValue: string) {
    if (isWarmupRef.current) return;
    const weight = Number.parseFloat(weightValue);
    const reps = Number.parseInt(repsValue, 10);
    if (!Number.isFinite(weight) || weight < 0 || !Number.isFinite(reps) || reps <= 0) {
      return;
    }

    const candidate: WorkoutSet = { ...set, weight, reps };
    const detected = detectPRsFromSets([candidate], existingPRs);
    if (detected.length > 0) celebratePr(detected);
  }

  function handleRepsBlur(value: string) {
    save("reps", value);

    const weightValue = weightRef.current?.value ?? String(set.weight ?? "");
    checkForPr(weightValue, value);

    if (shouldStartRestTimer(weightValue, value, set.is_warmup) && sessionActive) {
      startRestTimer({
        setId: set.id,
        exerciseName,
        setNumber: set.set_number,
      });
    }
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
    <div className={cn(isPending && "opacity-60", set.is_warmup && "opacity-70")}>
      <div className="grid grid-cols-[2rem_1fr_1fr_1fr_auto] items-center gap-2 py-1.5">
        <span className="text-xs text-muted-foreground tabular-nums">
          {set.set_number}
        </span>
        {isActive ? (
          <>
            <Input
              ref={weightRef}
              type="number"
              inputMode="decimal"
              min={0}
              step={0.5}
              defaultValue={set.weight ?? ""}
              placeholder={weightUnit}
              className="h-8 text-sm tabular-nums"
              onBlur={(e) => save("weight", e.target.value)}
            />
            <Input
              ref={repsRef}
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={set.reps ?? ""}
              placeholder="reps"
              className="h-8 text-sm tabular-nums"
              onBlur={(e) => handleRepsBlur(e.target.value)}
            />
            <Input
              ref={rpeRef}
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
                onClick={() => setShowNotes((v) => !v)}
                className={cn(
                  "rounded p-1 text-muted-foreground hover:text-foreground",
                  (showNotes || set.notes) && "text-primary",
                )}
                aria-label="Set notes"
              >
                <StickyNote className="h-3.5 w-3.5" />
              </button>
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
              {set.is_warmup ? "W" : set.rest_seconds ? `${set.rest_seconds}s` : ""}
            </span>
          </>
        )}
      </div>
      {isActive && showNotes && (
        <Input
          ref={notesRef}
          defaultValue={set.notes ?? ""}
          placeholder="Set notes (form, pain, machine…)"
          className="mb-1 h-8 text-xs"
          onBlur={(e) => save("notes", e.target.value)}
        />
      )}
      {!isActive && set.notes && (
        <p className="pb-1 pl-8 text-xs text-muted-foreground">{set.notes}</p>
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
