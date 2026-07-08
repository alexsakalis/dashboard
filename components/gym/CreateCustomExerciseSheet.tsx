"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createCustomExerciseFull } from "@/lib/actions/exercise-library";
import {
  BODY_PARTS,
  BODY_PART_LABELS,
  MUSCLE_GROUPS,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_TYPES,
  EQUIPMENT_LABELS,
  DIFFICULTY_LEVELS,
  DIFFICULTY_LABELS,
  MOVEMENT_TYPES,
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_PATTERNS,
  MOVEMENT_PATTERN_LABELS,
} from "@/lib/gym/constants";
import type { BodyPart } from "@/types/gym";

interface CreateCustomExerciseSheetProps {
  trigger?: React.ReactElement;
  onCreated?: (exerciseId: string) => void;
}

export function CreateCustomExerciseSheet({
  trigger,
  onCreated,
}: CreateCustomExerciseSheetProps) {
  const [open, setOpen] = useState(false);
  const [bodyPart, setBodyPart] = useState<BodyPart>("chest");
  const [muscleGroup, setMuscleGroup] = useState("chest");
  const [equipment, setEquipment] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [movementType, setMovementType] = useState<string>("");
  const [movementPattern, setMovementPattern] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("body_part", bodyPart);
    formData.set("muscle_group", muscleGroup);
    if (equipment) formData.set("equipment", equipment);
    if (difficulty) formData.set("difficulty", difficulty);
    if (movementType) formData.set("movement_type", movementType);
    if (movementPattern) formData.set("movement_pattern", movementPattern);

    startTransition(async () => {
      const created = await createCustomExerciseFull(formData);
      setOpen(false);
      if (onCreated) {
        onCreated(created.id);
      } else {
        router.push(`/gym/exercises/${created.id}`);
        router.refresh();
      }
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          trigger ?? (
            <Button size="sm" className="h-7 gap-1 px-2.5 text-[0.8rem]">
              <Plus className="h-3.5 w-3.5" />
              Custom
            </Button>
          )
        }
      />
      <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create custom exercise</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Exercise name</Label>
            <Input id="name" name="name" required placeholder="e.g. Cable Crossover" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Body part</Label>
              <Select value={bodyPart} onValueChange={(v) => setBodyPart((v ?? "chest") as BodyPart)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BODY_PARTS.map((part) => (
                    <SelectItem key={part} value={part}>
                      {BODY_PART_LABELS[part]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Primary muscle</Label>
              <Select value={muscleGroup} onValueChange={(v) => setMuscleGroup(v ?? "chest")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MUSCLE_GROUPS.map((mg) => (
                    <SelectItem key={mg} value={mg}>
                      {MUSCLE_GROUP_LABELS[mg]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondary_muscle_groups">
              Secondary muscles (comma-separated)
            </Label>
            <Input
              id="secondary_muscle_groups"
              name="secondary_muscle_groups"
              placeholder="shoulders, triceps"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Equipment</Label>
              <Select value={equipment} onValueChange={(v) => setEquipment(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {EQUIPMENT_TYPES.map((eq) => (
                    <SelectItem key={eq} value={eq}>
                      {EQUIPMENT_LABELS[eq]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => setDifficulty(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTY_LEVELS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {DIFFICULTY_LABELS[d]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Movement type</Label>
              <Select value={movementType} onValueChange={(v) => setMovementType(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {MOVEMENT_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Movement pattern</Label>
              <Select value={movementPattern} onValueChange={(v) => setMovementPattern(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {MOVEMENT_PATTERNS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {MOVEMENT_PATTERN_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">Instructions (optional)</Label>
            <Textarea
              id="instructions"
              name="instructions"
              rows={3}
              placeholder="Form cues, setup notes..."
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating..." : "Create exercise"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
