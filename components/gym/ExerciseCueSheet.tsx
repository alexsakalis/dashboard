"use client";

import Link from "next/link";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface ExerciseCueSheetProps {
  exerciseName: string;
  exerciseLibraryId?: string | null;
  instructions?: string | null;
}

export function ExerciseCueSheet({
  exerciseName,
  exerciseLibraryId,
  instructions,
}: ExerciseCueSheetProps) {
  if (!exerciseLibraryId && !instructions) return null;

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground"
            aria-label="Exercise info"
          >
            <Info className="h-4 w-4" />
          </Button>
        }
      />
      <SheetContent side="bottom" className="max-h-[70dvh]">
        <SheetHeader>
          <SheetTitle>{exerciseName}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          {instructions ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {instructions}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              View form cues and progress history for this exercise.
            </p>
          )}
          {exerciseLibraryId && (
            <Link
              href={`/gym/exercises/${exerciseLibraryId}`}
              className="inline-flex text-sm font-medium text-primary hover:underline"
            >
              Open exercise details →
            </Link>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
