"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  BODY_PARTS,
  BODY_PART_LABELS,
  EQUIPMENT_TYPES,
  EQUIPMENT_LABELS,
  DIFFICULTY_LEVELS,
  DIFFICULTY_LABELS,
  WORKOUT_SPLITS,
  SPLIT_LABELS,
  MOVEMENT_TYPES,
  MOVEMENT_TYPE_LABELS,
} from "@/lib/gym/constants";

export function ExerciseLibraryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentBodyPart = searchParams.get("bodyPart") ?? "all";
  const currentEquipment = searchParams.get("equipment") ?? "all";
  const currentDifficulty = searchParams.get("difficulty") ?? "all";
  const currentSplit = searchParams.get("split") ?? "all";
  const currentMovementType = searchParams.get("movementType") ?? "all";
  const favoritesOnly = searchParams.get("favorites") === "true";
  const includeHidden = searchParams.get("hidden") === "true";

  function updateParam(key: string, value: string | boolean) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === false || value === "") {
      params.delete(key);
    } else {
      params.set(key, String(value));
    }
    router.push(`/gym/exercises?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <Tabs
        value={currentBodyPart}
        onValueChange={(v) => updateParam("bodyPart", v)}
      >
        <TabsList className="h-auto w-full flex-wrap">
          <TabsTrigger value="all" className="text-xs">
            All
          </TabsTrigger>
          {BODY_PARTS.map((part) => (
            <TabsTrigger key={part} value={part} className="text-xs">
              {BODY_PART_LABELS[part]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-2 gap-2">
        <Select
          value={currentEquipment}
          onValueChange={(v) => updateParam("equipment", v ?? "all")}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Equipment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All equipment</SelectItem>
            {EQUIPMENT_TYPES.map((eq) => (
              <SelectItem key={eq} value={eq}>
                {EQUIPMENT_LABELS[eq]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentDifficulty}
          onValueChange={(v) => updateParam("difficulty", v ?? "all")}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {DIFFICULTY_LEVELS.map((d) => (
              <SelectItem key={d} value={d}>
                {DIFFICULTY_LABELS[d]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentSplit}
          onValueChange={(v) => updateParam("split", v ?? "all")}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Split" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All splits</SelectItem>
            {WORKOUT_SPLITS.filter((s) => s !== "custom").map((split) => (
              <SelectItem key={split} value={split}>
                {SPLIT_LABELS[split]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={currentMovementType}
          onValueChange={(v) => updateParam("movementType", v ?? "all")}
        >
          <SelectTrigger className="h-9 text-xs">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {MOVEMENT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {MOVEMENT_TYPE_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch
            id="favorites"
            checked={favoritesOnly}
            onCheckedChange={(v) => updateParam("favorites", v)}
          />
          <Label htmlFor="favorites" className="text-xs">
            Favorites only
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="hidden"
            checked={includeHidden}
            onCheckedChange={(v) => updateParam("hidden", v)}
          />
          <Label htmlFor="hidden" className="text-xs">
            Show hidden
          </Label>
        </div>
      </div>
    </div>
  );
}
