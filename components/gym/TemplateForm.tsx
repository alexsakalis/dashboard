"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Search } from "lucide-react";
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
  createWorkoutTemplate,
  updateWorkoutTemplate,
} from "@/lib/actions/gym";
import { ExercisePickerSheet } from "@/components/gym/ExercisePickerSheet";
import { WORKOUT_SPLITS, SPLIT_LABELS } from "@/lib/gym/constants";
import type {
  WorkoutSplit,
  WorkoutTemplateExercise,
  ExerciseLibraryEntry,
} from "@/types/gym";

interface TemplateFormProps {
  templateId?: string;
  initial?: {
    name: string;
    split: WorkoutSplit | null;
    exercises: WorkoutTemplateExercise[];
  };
}

export function TemplateForm({ templateId, initial }: TemplateFormProps) {
  const [split, setSplit] = useState<WorkoutSplit>(initial?.split ?? "push");
  const [exercises, setExercises] = useState<WorkoutTemplateExercise[]>(
    initial?.exercises ?? [],
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handlePickerSelect(entry: ExerciseLibraryEntry) {
    setExercises([
      ...exercises,
      {
        exercise_name: entry.name,
        muscle_group: entry.muscle_group,
        exercise_library_id: entry.id,
        default_sets: 3,
        default_reps: 10,
      },
    ]);
    setPickerOpen(false);
  }

  function updateExercise(
    index: number,
    field: keyof WorkoutTemplateExercise,
    value: string | number,
  ) {
    const next = [...exercises];
    next[index] = { ...next[index], [field]: value };
    setExercises(next);
  }

  function removeExercise(index: number) {
    setExercises(exercises.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("split", split);
    formData.set(
      "exercises",
      JSON.stringify(
        exercises.filter((ex) => ex.exercise_name.trim()).map((ex) => ({
          exercise_name: ex.exercise_name,
          muscle_group: ex.muscle_group || null,
          exercise_library_id: ex.exercise_library_id ?? null,
          default_sets: ex.default_sets,
          default_reps: ex.default_reps,
          notes: ex.notes,
        })),
      ),
    );

    startTransition(async () => {
      if (templateId) {
        await updateWorkoutTemplate(templateId, formData);
      } else {
        await createWorkoutTemplate(formData);
      }
      router.push("/gym/templates");
      router.refresh();
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Template name</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={initial?.name}
            placeholder="Push Template"
          />
        </div>
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
        <div className="space-y-3">
          <Label>Exercises</Label>
          {exercises.map((ex, i) => (
            <div key={i} className="flex gap-2">
              <Input
                value={ex.exercise_name}
                readOnly
                className="flex-1 bg-muted/30"
              />
              <Input
                type="number"
                value={ex.default_sets}
                onChange={(e) =>
                  updateExercise(i, "default_sets", parseInt(e.target.value, 10))
                }
                className="w-16"
                min={1}
                aria-label="Sets"
              />
              <Input
                type="number"
                value={ex.default_reps ?? ""}
                onChange={(e) =>
                  updateExercise(i, "default_reps", parseInt(e.target.value, 10))
                }
                className="w-16"
                placeholder="Reps"
                aria-label="Reps"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeExercise(i)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen(true)}
          >
            <Search className="mr-1 h-4 w-4" />
            Add from library
          </Button>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isPending || exercises.length === 0}
        >
          {isPending ? "Saving..." : templateId ? "Update template" : "Create template"}
        </Button>
      </form>

      <ExercisePickerSheet
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handlePickerSelect}
        defaultSplit={split}
      />
    </>
  );
}
