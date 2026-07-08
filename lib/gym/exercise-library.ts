import type {
  EnrichedExerciseLibraryEntry,
  ExerciseLibraryFilters,
  BodyPart,
} from "@/types/gym";
import { BODY_PARTS, BODY_PART_LABELS } from "@/lib/gym/constants";

export function applyExerciseFilters(
  entries: EnrichedExerciseLibraryEntry[],
  filters: ExerciseLibraryFilters,
): EnrichedExerciseLibraryEntry[] {
  let result = entries;

  if (!filters.includeHidden) {
    result = result.filter((e) => !e.is_hidden);
  }

  if (filters.favoritesOnly) {
    result = result.filter((e) => e.is_favorite);
  }

  if (filters.bodyPart && filters.bodyPart !== "all") {
    result = result.filter((e) => e.body_part === filters.bodyPart);
  }

  if (filters.equipment && filters.equipment !== "all") {
    result = result.filter((e) => e.equipment === filters.equipment);
  }

  if (filters.difficulty && filters.difficulty !== "all") {
    result = result.filter((e) => e.difficulty === filters.difficulty);
  }

  if (filters.split && filters.split !== "all" && filters.split !== "custom") {
    result = result.filter((e) => e.split_tags.includes(filters.split!));
  }

  if (filters.movementType && filters.movementType !== "all") {
    result = result.filter((e) => e.movement_type === filters.movementType);
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim().toLowerCase();
    result = result.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.aliases.some((a) => a.toLowerCase().includes(q)) ||
        e.muscle_group.toLowerCase().includes(q),
    );
  }

  if (filters.limit) {
    result = result.slice(0, filters.limit);
  }

  return result;
}

export function groupExercisesByBodyPart(
  entries: EnrichedExerciseLibraryEntry[],
): Map<BodyPart, EnrichedExerciseLibraryEntry[]> {
  const groups = new Map<BodyPart, EnrichedExerciseLibraryEntry[]>();

  for (const part of BODY_PARTS) {
    groups.set(part, []);
  }

  for (const entry of entries) {
    const list = groups.get(entry.body_part as BodyPart);
    if (list) {
      list.push(entry);
    }
  }

  for (const [, list] of groups) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }

  return groups;
}

export function getBodyPartLabel(bodyPart: string): string {
  return BODY_PART_LABELS[bodyPart as BodyPart] ?? bodyPart;
}

export function sortExercisesWithFavoritesFirst(
  entries: EnrichedExerciseLibraryEntry[],
): EnrichedExerciseLibraryEntry[] {
  return [...entries].sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
