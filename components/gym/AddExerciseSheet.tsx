"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { addWorkoutExercise } from "@/lib/actions/gym";
import { ExercisePickerSheet } from "@/components/gym/ExercisePickerSheet";
import type { ExerciseLibraryEntry, WorkoutSplit } from "@/types/gym";

interface AddExerciseSheetProps {
  workoutId: string;
  workoutSplit?: WorkoutSplit | null;
}

export function AddExerciseSheet({ workoutId, workoutSplit }: AddExerciseSheetProps) {
  const [open, setOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  function handleSelect(exercise: ExerciseLibraryEntry) {
    const formData = new FormData();
    formData.set("workout_id", workoutId);
    formData.set("exercise_name", exercise.name);
    formData.set("muscle_group", exercise.muscle_group);
    formData.set("exercise_library_id", exercise.id);

    startTransition(async () => {
      await addWorkoutExercise(formData);
      setOpen(false);
      setPickerOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="outline" size="sm" className="flex-1">
              <Plus className="mr-1 h-4 w-4" />
              Add exercise
            </Button>
          }
        />
        <SheetContent side="bottom" className="max-h-[50dvh]">
          <SheetHeader>
            <SheetTitle>Add exercise</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            <Button
              className="w-full"
              onClick={() => {
                setOpen(false);
                setPickerOpen(true);
              }}
            >
              Browse exercise library
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Search 150+ exercises or create a custom one
            </p>
          </div>
        </SheetContent>
      </Sheet>

      <ExercisePickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelect}
        defaultSplit={workoutSplit ?? undefined}
      />
    </>
  );
}
