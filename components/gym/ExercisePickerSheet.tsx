"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Star, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CreateCustomExerciseSheet } from "@/components/gym/CreateCustomExerciseSheet";
import {
  searchExerciseLibrary,
  toggleExerciseFavorite,
} from "@/lib/actions/exercise-library";
import {
  EQUIPMENT_LABELS,
  BODY_PART_LABELS,
} from "@/lib/gym/constants";
import type {
  EnrichedExerciseLibraryEntry,
  WorkoutSplit,
  ExerciseLibraryEntry,
} from "@/types/gym";
import { cn } from "@/lib/utils";

interface ExercisePickerSheetProps {
  onSelect: (exercise: ExerciseLibraryEntry) => void;
  trigger?: React.ReactElement;
  defaultSplit?: WorkoutSplit;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ExercisePickerSheet({
  onSelect,
  trigger,
  defaultSplit,
  open: controlledOpen,
  onOpenChange,
}: ExercisePickerSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<EnrichedExerciseLibraryEntry[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const doSearch = useCallback(
    (q: string, favOnly: boolean) => {
      startTransition(async () => {
        const filters: Parameters<typeof searchExerciseLibrary>[1] = {
          favoritesOnly: favOnly,
        };
        if (defaultSplit && defaultSplit !== "custom") {
          filters.split = defaultSplit;
        }
        const data = await searchExerciseLibrary(q, filters, 30);
        setResults(data);
      });
    },
    [defaultSplit],
  );

  useEffect(() => {
    if (open) {
      doSearch(query, favoritesOnly);
    }
  }, [open, query, favoritesOnly, doSearch]);

  function handleSelect(exercise: EnrichedExerciseLibraryEntry) {
    onSelect(exercise);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function handleFavorite(e: React.MouseEvent, exerciseId: string) {
    e.stopPropagation();
    startTransition(async () => {
      await toggleExerciseFavorite(exerciseId);
      doSearch(query, favoritesOnly);
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {trigger && <SheetTrigger render={trigger} />}
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Select exercise</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search exercises..."
              className="pl-9"
              autoComplete="off"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={favoritesOnly ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFavoritesOnly(!favoritesOnly)}
            >
              <Star className={cn("mr-1 h-3 w-3", favoritesOnly && "fill-current")} />
              Favorites
            </Button>
            <CreateCustomExerciseSheet
              trigger={
                <Button variant="outline" size="sm" className="h-7 text-xs">
                  <Plus className="mr-1 h-3 w-3" />
                  Custom
                </Button>
              }
              onCreated={(id) => {
                startTransition(async () => {
                  const data = await searchExerciseLibrary("", {}, 500);
                  const created = data.find((e) => e.id === id);
                  if (created) handleSelect(created);
                });
              }}
            />
          </div>

          {isPending && results.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Searching...
            </p>
          )}

          {!isPending && results.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              {query ? "No exercises found." : "Start typing to search."}
            </p>
          )}

          {results.length > 0 && (
            <ul className="divide-y divide-border rounded-xl border border-border/50">
              {results.map((ex) => (
                <li key={ex.id}>
                  <div className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-muted/50">
                    <button
                      type="button"
                      onClick={(e) => handleFavorite(e, ex.id)}
                      className="shrink-0 p-0.5"
                      aria-label={ex.is_favorite ? "Unfavorite" : "Favorite"}
                    >
                      <Star
                        className={cn(
                          "h-3.5 w-3.5",
                          ex.is_favorite
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground",
                        )}
                      />
                    </button>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => handleSelect(ex)}
                    >
                      <p className="truncate text-sm font-medium">{ex.name}</p>
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        <Badge variant="secondary" className="text-[10px]">
                          {BODY_PART_LABELS[ex.body_part] ?? ex.body_part}
                        </Badge>
                        {ex.equipment && (
                          <Badge variant="outline" className="text-[10px]">
                            {EQUIPMENT_LABELS[ex.equipment as keyof typeof EQUIPMENT_LABELS] ??
                              ex.equipment}
                          </Badge>
                        )}
                      </div>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
