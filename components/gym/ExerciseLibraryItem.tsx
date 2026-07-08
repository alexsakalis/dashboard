"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Star, EyeOff, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  toggleExerciseFavorite,
  setExerciseHidden,
} from "@/lib/actions/exercise-library";
import {
  EQUIPMENT_LABELS,
  DIFFICULTY_LABELS,
  MOVEMENT_TYPE_LABELS,
} from "@/lib/gym/constants";
import type { EnrichedExerciseLibraryEntry } from "@/types/gym";
import { cn } from "@/lib/utils";

interface ExerciseLibraryItemProps {
  entry: EnrichedExerciseLibraryEntry;
}

export function ExerciseLibraryItem({ entry }: ExerciseLibraryItemProps) {
  const [isPending, startTransition] = useTransition();

  function handleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await toggleExerciseFavorite(entry.id);
    });
  }

  function handleHide() {
    startTransition(async () => {
      await setExerciseHidden(entry.id, !entry.is_hidden);
    });
  }

  return (
    <Link href={`/gym/exercises/${entry.id}`} className="block">
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/50 active:bg-muted/70",
          entry.is_hidden && "opacity-50",
        )}
      >
        <button
          type="button"
          onClick={handleFavorite}
          disabled={isPending}
          className="shrink-0 p-0.5"
          aria-label={entry.is_favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            className={cn(
              "h-4 w-4",
              entry.is_favorite
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground",
            )}
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-medium">{entry.name}</p>
            {entry.is_custom && (
              <Badge variant="outline" className="shrink-0 text-[10px]">
                Custom
              </Badge>
            )}
          </div>
          <div className="mt-1 flex flex-wrap gap-1">
            {entry.equipment && (
              <Badge variant="secondary" className="text-[10px]">
                {EQUIPMENT_LABELS[entry.equipment as keyof typeof EQUIPMENT_LABELS] ??
                  entry.equipment}
              </Badge>
            )}
            {entry.movement_type && (
              <Badge variant="secondary" className="text-[10px]">
                {MOVEMENT_TYPE_LABELS[entry.movement_type]}
              </Badge>
            )}
            {entry.difficulty && (
              <Badge variant="outline" className="text-[10px]">
                {DIFFICULTY_LABELS[entry.difficulty]}
              </Badge>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={(e) => e.preventDefault()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleHide}>
              <EyeOff className="mr-2 h-4 w-4" />
              {entry.is_hidden ? "Unhide" : "Hide"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Link>
  );
}
