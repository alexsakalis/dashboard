"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { isMissingSchemaError } from "@/lib/gym/schema-compat";
import { applyExerciseFilters } from "@/lib/gym/exercise-library";
import { deriveSplitTags } from "@/lib/gym/constants";
import {
  createCustomExerciseSchema,
  updateCustomExerciseSchema,
} from "@/lib/gym/validators";
import type {
  EnrichedExerciseLibraryEntry,
  ExerciseLibraryEntry,
  ExerciseLibraryFilters,
} from "@/types/gym";

function revalidateExercisePaths() {
  revalidatePath("/gym/exercises");
  revalidatePath("/gym");
  revalidatePath("/gym/progress");
}

async function fetchUserPreferences(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("exercise_user_preferences")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    if (isMissingSchemaError(error)) return new Map<string, { is_favorite: boolean; is_hidden: boolean }>();
    throw error;
  }

  const map = new Map<string, { is_favorite: boolean; is_hidden: boolean }>();
  for (const pref of data ?? []) {
    map.set(pref.exercise_library_id, {
      is_favorite: pref.is_favorite,
      is_hidden: pref.is_hidden,
    });
  }
  return map;
}

function enrichEntries(
  entries: ExerciseLibraryEntry[],
  prefs: Map<string, { is_favorite: boolean; is_hidden: boolean }>,
): EnrichedExerciseLibraryEntry[] {
  return entries.map((entry) => {
    const pref = prefs.get(entry.id);
    return {
      ...entry,
      is_favorite: pref?.is_favorite ?? false,
      is_hidden: pref?.is_hidden ?? false,
    };
  });
}

export async function getExerciseLibraryFiltered(
  filters: ExerciseLibraryFilters = {},
): Promise<EnrichedExerciseLibraryEntry[]> {
  const user = await requireUser();
  const supabase = await createClient();

  let query = supabase
    .from("exercise_library")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("name");

  if (filters.bodyPart && filters.bodyPart !== "all") {
    query = query.eq("body_part", filters.bodyPart);
  }
  if (filters.equipment && filters.equipment !== "all") {
    query = query.eq("equipment", filters.equipment);
  }
  if (filters.difficulty && filters.difficulty !== "all") {
    query = query.eq("difficulty", filters.difficulty);
  }
  if (filters.movementType && filters.movementType !== "all") {
    query = query.eq("movement_type", filters.movementType);
  }
  if (filters.split && filters.split !== "all" && filters.split !== "custom") {
    query = query.contains("split_tags", [filters.split]);
  }
  if (filters.query?.trim()) {
    query = query.ilike("name", `%${filters.query.trim()}%`);
  }

  const limit = filters.limit ?? 500;
  query = query.limit(limit);

  const { data, error } = await query;

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }

  const prefs = await fetchUserPreferences(user.id);
  const enriched = enrichEntries((data ?? []) as ExerciseLibraryEntry[], prefs);

  return applyExerciseFilters(enriched, filters);
}

export async function getExerciseById(
  id: string,
): Promise<EnrichedExerciseLibraryEntry | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exercise_library")
    .select("*")
    .eq("id", id)
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  if (!data) return null;

  const prefs = await fetchUserPreferences(user.id);
  const enriched = enrichEntries([data as ExerciseLibraryEntry], prefs)[0];

  const { count } = await supabase
    .from("workout_exercises")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("exercise_library_id", id);

  return { ...enriched, usage_count: count ?? 0 };
}

export async function getExerciseByName(
  name: string,
): Promise<EnrichedExerciseLibraryEntry | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exercise_library")
    .select("*")
    .ilike("name", name)
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  if (!data) return null;

  const prefs = await fetchUserPreferences(user.id);
  return enrichEntries([data as ExerciseLibraryEntry], prefs)[0];
}

export async function toggleExerciseFavorite(exerciseId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("exercise_user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .eq("exercise_library_id", exerciseId)
    .maybeSingle();

  const newFavorite = !(existing?.is_favorite ?? false);

  const { error } = await supabase.from("exercise_user_preferences").upsert(
    {
      user_id: user.id,
      exercise_library_id: exerciseId,
      is_favorite: newFavorite,
      is_hidden: existing?.is_hidden ?? false,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,exercise_library_id" },
  );

  if (error) throw error;
  revalidateExercisePaths();
  return newFavorite;
}

export async function setExerciseHidden(exerciseId: string, hidden: boolean) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("exercise_user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .eq("exercise_library_id", exerciseId)
    .maybeSingle();

  const { error } = await supabase.from("exercise_user_preferences").upsert(
    {
      user_id: user.id,
      exercise_library_id: exerciseId,
      is_favorite: existing?.is_favorite ?? false,
      is_hidden: hidden,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,exercise_library_id" },
  );

  if (error) throw error;
  revalidateExercisePaths();
}

export async function createCustomExerciseFull(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const secondaryRaw = formData.get("secondary_muscle_groups");
  const secondaryMuscleGroups =
    typeof secondaryRaw === "string" && secondaryRaw.trim()
      ? secondaryRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      : [];

  const parsed = createCustomExerciseSchema.parse({
    name: formData.get("name"),
    body_part: formData.get("body_part"),
    muscle_group: formData.get("muscle_group"),
    secondary_muscle_groups: secondaryMuscleGroups,
    equipment: formData.get("equipment") || null,
    movement_pattern: formData.get("movement_pattern") || null,
    movement_type: formData.get("movement_type") || null,
    difficulty: formData.get("difficulty") || null,
    instructions: formData.get("instructions") || null,
  });

  const splitTags = deriveSplitTags(parsed.muscle_group, parsed.secondary_muscle_groups);

  const { data, error } = await supabase
    .from("exercise_library")
    .insert({
      user_id: user.id,
      name: parsed.name,
      body_part: parsed.body_part,
      muscle_group: parsed.muscle_group,
      secondary_muscle_groups: parsed.secondary_muscle_groups,
      equipment: parsed.equipment,
      movement_pattern: parsed.movement_pattern,
      movement_type: parsed.movement_type,
      difficulty: parsed.difficulty,
      split_tags: splitTags,
      instructions: parsed.instructions,
      is_custom: true,
    })
    .select()
    .single();

  if (error) throw error;
  revalidateExercisePaths();
  return data as ExerciseLibraryEntry;
}

export async function updateCustomExercise(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const secondaryRaw = formData.get("secondary_muscle_groups");
  const secondaryMuscleGroups =
    typeof secondaryRaw === "string" && secondaryRaw.trim()
      ? secondaryRaw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      : undefined;

  const parsed = updateCustomExerciseSchema.parse({
    id: formData.get("id"),
    name: formData.get("name") || undefined,
    body_part: formData.get("body_part") || undefined,
    muscle_group: formData.get("muscle_group") || undefined,
    secondary_muscle_groups: secondaryMuscleGroups,
    equipment: formData.get("equipment") || undefined,
    movement_pattern: formData.get("movement_pattern") || undefined,
    movement_type: formData.get("movement_type") || undefined,
    difficulty: formData.get("difficulty") || undefined,
    instructions: formData.get("instructions") || undefined,
  });

  const { id, ...updates } = parsed;
  const muscleGroup = updates.muscle_group;
  const secondary = updates.secondary_muscle_groups;

  const payload: Record<string, unknown> = { ...updates };
  if (muscleGroup) {
    payload.split_tags = deriveSplitTags(
      muscleGroup,
      secondary ?? [],
    );
  }

  const { data, error } = await supabase
    .from("exercise_library")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_custom", true)
    .select()
    .single();

  if (error) throw error;
  revalidateExercisePaths();
  return data as ExerciseLibraryEntry;
}

export async function deleteCustomExercise(exerciseId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("exercise_library")
    .delete()
    .eq("id", exerciseId)
    .eq("user_id", user.id)
    .eq("is_custom", true);

  if (error) throw error;
  revalidateExercisePaths();
}

export async function searchExerciseLibrary(
  query: string,
  filters: Omit<ExerciseLibraryFilters, "query"> = {},
  limit = 20,
): Promise<EnrichedExerciseLibraryEntry[]> {
  return getExerciseLibraryFiltered({ ...filters, query, limit, includeHidden: false });
}

export async function getExerciseLibrary(
  limit = 100,
): Promise<EnrichedExerciseLibraryEntry[]> {
  return getExerciseLibraryFiltered({ limit, includeHidden: false });
}

/** @deprecated Use createCustomExerciseFull instead */
export async function createCustomExercise(name: string, muscleGroup: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const bodyPart = muscleGroup === "custom" ? "full_body" : muscleGroup;
  const splitTags = deriveSplitTags(muscleGroup === "custom" ? "full_body" : muscleGroup);

  const { data, error } = await supabase
    .from("exercise_library")
    .insert({
      user_id: user.id,
      name: name.trim(),
      body_part: bodyPart,
      muscle_group: muscleGroup === "custom" ? "full_body" : muscleGroup,
      split_tags: splitTags,
      is_custom: true,
    })
    .select()
    .single();

  if (error) throw error;
  revalidateExercisePaths();
  return data as ExerciseLibraryEntry;
}

export async function getFavoriteExercises(): Promise<EnrichedExerciseLibraryEntry[]> {
  return getExerciseLibraryFiltered({ favoritesOnly: true, limit: 50 });
}
