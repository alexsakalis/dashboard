"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  toggleExerciseFavorite,
  setExerciseHidden,
  deleteCustomExercise,
} from "@/lib/actions/exercise-library";
import {
  BODY_PART_LABELS,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
  DIFFICULTY_LABELS,
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_PATTERN_LABELS,
} from "@/lib/gym/constants";
import type { EnrichedExerciseLibraryEntry } from "@/types/gym";
import { cn } from "@/lib/utils";

interface ExerciseDetailActionsProps {
  exercise: EnrichedExerciseLibraryEntry;
}

export function ExerciseDetailActions({ exercise }: ExerciseDetailActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleFavorite() {
    startTransition(async () => {
      await toggleExerciseFavorite(exercise.id);
      router.refresh();
    });
  }

  function handleHide() {
    startTransition(async () => {
      await setExerciseHidden(exercise.id, !exercise.is_hidden);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm(`Delete "${exercise.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      await deleteCustomExercise(exercise.id);
      router.push("/gym/exercises");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleFavorite}
        disabled={isPending}
        aria-label={exercise.is_favorite ? "Remove from favorites" : "Add to favorites"}
      >
        <Star
          className={cn(
            "h-4 w-4",
            exercise.is_favorite
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground",
          )}
        />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={handleHide}
        disabled={isPending}
        aria-label={exercise.is_hidden ? "Unhide exercise" : "Hide exercise"}
      >
        <EyeOff className="h-4 w-4" />
      </Button>
      {exercise.is_custom && (
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 text-destructive"
          onClick={handleDelete}
          disabled={isPending}
          aria-label="Delete custom exercise"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

interface ExerciseMetadataCardProps {
  exercise: EnrichedExerciseLibraryEntry;
}

export function ExerciseMetadataCard({ exercise }: ExerciseMetadataCardProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-border/50 bg-card/90 p-4">
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary">
          {BODY_PART_LABELS[exercise.body_part] ?? exercise.body_part}
        </Badge>
        <Badge variant="secondary" className="capitalize">
          {MUSCLE_GROUP_LABELS[exercise.muscle_group as keyof typeof MUSCLE_GROUP_LABELS] ??
            exercise.muscle_group}
        </Badge>
        {exercise.is_custom && <Badge variant="outline">Custom</Badge>}
      </div>

      {exercise.secondary_muscle_groups.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground">Secondary muscles</p>
          <p className="mt-0.5 text-sm capitalize">
            {exercise.secondary_muscle_groups.join(", ")}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        {exercise.equipment && (
          <div>
            <p className="text-xs text-muted-foreground">Equipment</p>
            <p className="font-medium">
              {EQUIPMENT_LABELS[exercise.equipment as keyof typeof EQUIPMENT_LABELS] ??
                exercise.equipment}
            </p>
          </div>
        )}
        {exercise.movement_type && (
          <div>
            <p className="text-xs text-muted-foreground">Type</p>
            <p className="font-medium">
              {MOVEMENT_TYPE_LABELS[exercise.movement_type]}
            </p>
          </div>
        )}
        {exercise.movement_pattern && (
          <div>
            <p className="text-xs text-muted-foreground">Pattern</p>
            <p className="font-medium">
              {MOVEMENT_PATTERN_LABELS[exercise.movement_pattern]}
            </p>
          </div>
        )}
        {exercise.difficulty && (
          <div>
            <p className="text-xs text-muted-foreground">Difficulty</p>
            <p className="font-medium">
              {DIFFICULTY_LABELS[exercise.difficulty]}
            </p>
          </div>
        )}
      </div>

      {exercise.instructions && (
        <div>
          <p className="text-xs text-muted-foreground">Instructions</p>
          <p className="mt-0.5 text-sm">{exercise.instructions}</p>
        </div>
      )}

      {(exercise.usage_count ?? 0) > 0 && (
        <p className="text-xs text-muted-foreground">
          Used in {exercise.usage_count} workout{exercise.usage_count === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
}
