"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { workoutDuration } from "@/lib/gym/calculations";
import {
  buildExerciseProgressSummary,
  buildGymDashboard,
  buildLastWorkoutReference,
  enrichWorkout,
} from "@/lib/gym/enrich";
import { detectPRsFromSets } from "@/lib/gym/progress";
import {
  DEFAULT_TEMPLATE_EXERCISES,
  SPLIT_MUSCLE_GROUPS,
} from "@/lib/gym/constants";
import { matchSplitFromName } from "@/lib/gym/suggestions";
import {
  addExerciseSchema,
  addSetSchema,
  bodyWeightSchema,
  completeWorkoutSchema,
  createTemplateSchema,
  createWorkoutSchema,
  parseMuscleGroupsInput,
  updateSetSchema,
} from "@/lib/gym/validators";
import {
  FULL_WORKOUT_SELECT,
  LEGACY_WORKOUT_SELECT,
  isMissingSchemaError,
  normalizeWorkout,
} from "@/lib/gym/schema-compat";
import type {
  BodyWeightLog,
  ExerciseLibraryEntry,
  ExercisePersonalRecord,
  GymPreferences,
  LastWorkoutReference,
  Workout,
  WorkoutFilters,
  WorkoutSplit,
  WorkoutTemplate,
  WorkoutTemplateExercise,
} from "@/types/gym";

let cachedUsesFullGymSchema: boolean | null = null;

async function resolveWorkoutSelect(
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
  if (cachedUsesFullGymSchema === false) return LEGACY_WORKOUT_SELECT;
  if (cachedUsesFullGymSchema === true) return FULL_WORKOUT_SELECT;

  const { error } = await supabase
    .from("workouts")
    .select(FULL_WORKOUT_SELECT)
    .limit(1);

  cachedUsesFullGymSchema = !isMissingSchemaError(error);
  return cachedUsesFullGymSchema ? FULL_WORKOUT_SELECT : LEGACY_WORKOUT_SELECT;
}

function revalidateGymPaths(workoutId?: string) {
  revalidatePath("/gym");
  revalidatePath("/");
  if (workoutId) revalidatePath(`/gym/${workoutId}`);
  revalidatePath("/gym/history");
  revalidatePath("/gym/progress");
  revalidatePath("/gym/body-weight");
  revalidatePath("/gym/templates");
  revalidatePath("/gym/exercises");
}

function sortWorkoutData<T extends Workout>(workout: T): T {
  const normalized = normalizeWorkout(workout);
  if (normalized.workout_exercises) {
    normalized.workout_exercises.sort((a, b) => a.sort_order - b.sort_order);
    for (const ex of normalized.workout_exercises) {
      ex.workout_sets?.sort((a, b) => a.set_number - b.set_number);
    }
  }
  normalized.workout_sets?.sort((a, b) => a.set_number - b.set_number);
  return normalized as T;
}

export async function getWorkouts(filters: WorkoutFilters = {}) {
  const user = await requireUser();
  const supabase = await createClient();
  const limit = filters.limit ?? 20;
  const select = await resolveWorkoutSelect(supabase);
  const useFullSchema = select === FULL_WORKOUT_SELECT;

  let query = supabase
    .from("workouts")
    .select(select)
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (filters.split) {
    query = useFullSchema
      ? query.eq("split", filters.split)
      : query.eq("workout_type", filters.split);
  }
  if (filters.completedOnly) query = query.not("completed_at", "is", null);

  let { data, error } = await query;
  if (error && isMissingSchemaError(error)) {
    cachedUsesFullGymSchema = false;
    let legacyQuery = supabase
      .from("workouts")
      .select(LEGACY_WORKOUT_SELECT)
      .eq("user_id", user.id)
      .order("started_at", { ascending: false })
      .limit(limit);
    if (filters.split) legacyQuery = legacyQuery.eq("workout_type", filters.split);
    if (filters.completedOnly) legacyQuery = legacyQuery.not("completed_at", "is", null);
    ({ data, error } = await legacyQuery);
  }
  if (error) throw error;
  return (data ?? []).map((w) => sortWorkoutData(w as unknown as Workout));
}

export async function getWorkout(id: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const select = await resolveWorkoutSelect(supabase);

  let { data, error } = await supabase
    .from("workouts")
    .select(select)
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error && isMissingSchemaError(error)) {
    cachedUsesFullGymSchema = false;
    ({ data, error } = await supabase
      .from("workouts")
      .select(LEGACY_WORKOUT_SELECT)
      .eq("id", id)
      .eq("user_id", user.id)
      .single());
  }
  if (error) throw error;
  return sortWorkoutData(data as unknown as Workout);
}

export async function getLastWorkoutBySplit(
  split: WorkoutSplit,
): Promise<Workout | null> {
  const user = await requireUser();
  const supabase = await createClient();
  const select = await resolveWorkoutSelect(supabase);
  const useFullSchema = select === FULL_WORKOUT_SELECT;

  let query = supabase
    .from("workouts")
    .select(select)
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1);

  if (useFullSchema) {
    query = query.eq("split", split);
  } else {
    query = query.eq("workout_type", split);
  }

  let { data, error } = await query.maybeSingle();
  if (error && isMissingSchemaError(error)) {
    cachedUsesFullGymSchema = false;
    ({ data, error } = await supabase
      .from("workouts")
      .select(LEGACY_WORKOUT_SELECT)
      .eq("user_id", user.id)
      .eq("workout_type", split)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle());
  }
  if (error) throw error;
  return data ? sortWorkoutData(data as unknown as Workout) : null;
}

export async function getLastWorkoutReference(
  split: WorkoutSplit,
): Promise<LastWorkoutReference | null> {
  const workout = await getLastWorkoutBySplit(split);
  if (!workout) return null;
  return buildLastWorkoutReference(workout);
}

export async function getLastExercisePerformance(exerciseName: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: sets, error } = await supabase
    .from("workout_sets")
    .select("*, workouts!inner(completed_at)")
    .eq("user_id", user.id)
    .eq("exercise_name", exerciseName)
    .eq("is_warmup", false)
    .not("workouts.completed_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;
  if (!sets?.length) return null;

  const workoutId = sets[0].workout_id;
  return sets.filter((s) => s.workout_id === workoutId);
}

export async function getExerciseHistory(exerciseName: string, limit = 20) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workouts")
    .select(await resolveWorkoutSelect(supabase))
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(limit * 3);

  if (error && isMissingSchemaError(error)) {
    cachedUsesFullGymSchema = false;
    const { data: legacyData, error: legacyError } = await supabase
      .from("workouts")
      .select(LEGACY_WORKOUT_SELECT)
      .eq("user_id", user.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(limit * 3);
    if (legacyError) throw legacyError;
    return (legacyData ?? [])
      .map((w) => sortWorkoutData(w as unknown as Workout))
      .filter((w) =>
        (w.workout_sets ?? []).some((s) => s.exercise_name === exerciseName),
      )
      .slice(0, limit);
  }
  if (error) throw error;

  return (data ?? [])
    .map((w) => sortWorkoutData(w as unknown as Workout))
    .filter((w) =>
      (w.workout_sets ?? []).some((s) => s.exercise_name === exerciseName),
    )
    .slice(0, limit);
}

export async function getExerciseProgressSummary(exerciseName: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const [workouts, prsResult] = await Promise.all([
    getExerciseHistory(exerciseName, 30),
    supabase
      .from("exercise_personal_records")
      .select("*")
      .eq("user_id", user.id)
      .eq("exercise_name", exerciseName),
  ]);

  if (prsResult.error && !isMissingSchemaError(prsResult.error)) {
    throw prsResult.error;
  }
  return buildExerciseProgressSummary(
    exerciseName,
    workouts,
    (prsResult.data ?? []) as ExercisePersonalRecord[],
  );
}

export async function getBodyWeightLogs(limit = 30): Promise<BodyWeightLog[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("body_weight_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("logged_date", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return (data ?? []) as BodyWeightLog[];
}

export async function getLatestBodyWeight(): Promise<BodyWeightLog | null> {
  const logs = await getBodyWeightLogs(1);
  return logs[0] ?? null;
}

export async function getWorkoutTemplates(): Promise<WorkoutTemplate[]> {
  const user = await requireUser();
  const supabase = await createClient();

  await ensureDefaultTemplates(user.id);

  let { data, error } = await supabase
    .from("workout_templates")
    .select("*, workout_template_exercises(*)")
    .eq("user_id", user.id)
    .order("name");

  if (error && isMissingSchemaError(error)) {
    ({ data, error } = await supabase
      .from("workout_templates")
      .select("*")
      .eq("user_id", user.id)
      .order("name"));
  }
  if (error) throw error;

  return (data ?? []).map((t) => ({
    ...t,
    exercises: (t.workout_template_exercises ?? t.exercises ?? []) as WorkoutTemplateExercise[],
  })) as WorkoutTemplate[];
}

export async function getTemplate(id: string): Promise<WorkoutTemplate | null> {
  const user = await requireUser();
  const supabase = await createClient();

  let { data, error } = await supabase
    .from("workout_templates")
    .select("*, workout_template_exercises(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error && isMissingSchemaError(error)) {
    ({ data, error } = await supabase
      .from("workout_templates")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle());
  }
  if (error) throw error;
  if (!data) return null;

  return {
    ...data,
    exercises: (data.workout_template_exercises ?? data.exercises ?? []) as WorkoutTemplateExercise[],
  } as WorkoutTemplate;
}

export async function searchExerciseLibrary(
  query: string,
  limit = 20,
) {
  const { searchExerciseLibrary: search } = await import(
    "@/lib/actions/exercise-library"
  );
  return search(query, {}, limit);
}

export async function getExerciseLibrary(limit = 100) {
  const { getExerciseLibrary: getLibrary } = await import(
    "@/lib/actions/exercise-library"
  );
  return getLibrary(limit);
}

export async function getRecentPRs(limit = 5): Promise<ExercisePersonalRecord[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exercise_personal_records")
    .select("*")
    .eq("user_id", user.id)
    .order("achieved_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (isMissingSchemaError(error)) return [];
    throw error;
  }
  return (data ?? []) as ExercisePersonalRecord[];
}

export async function getGymDashboard() {
  const user = await requireUser();
  const supabase = await createClient();

  const [workouts, bodyWeight, recentPRs, allPRs] = await Promise.all([
    getWorkouts({ limit: 50, completedOnly: true }),
    getLatestBodyWeight(),
    getRecentPRs(5),
    supabase
      .from("exercise_personal_records")
      .select("*")
      .eq("user_id", user.id),
  ]);

  if (allPRs.error && !isMissingSchemaError(allPRs.error)) {
    throw allPRs.error;
  }

  const exerciseCounts = new Map<string, number>();
  for (const w of workouts) {
    for (const s of w.workout_sets ?? []) {
      exerciseCounts.set(s.exercise_name, (exerciseCounts.get(s.exercise_name) ?? 0) + 1);
    }
  }
  const topExercises = [...exerciseCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const exerciseWorkouts = new Map<string, Workout[]>();
  for (const name of topExercises.slice(0, 5)) {
    exerciseWorkouts.set(name, await getExerciseHistory(name, 10));
  }

  return buildGymDashboard({
    workouts,
    bodyWeight,
    recentPRs,
    topExercises,
    exerciseWorkouts,
    allPRs: (allPRs.data ?? []) as ExercisePersonalRecord[],
  });
}

export async function getGymPreferences(): Promise<GymPreferences | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gym_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    if (isMissingSchemaError(error)) return null;
    throw error;
  }
  return data as GymPreferences | null;
}

async function ensureDefaultTemplates(userId: string) {
  const supabase = await createClient();
  const { count, error: countError } = await supabase
    .from("workout_templates")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_system", true);

  if (countError && isMissingSchemaError(countError)) return;
  if (count && count > 0) return;

  for (const [split, exercises] of Object.entries(DEFAULT_TEMPLATE_EXERCISES)) {
    const templatePayload = {
      user_id: userId,
      name: `${split.charAt(0).toUpperCase() + split.slice(1)} Template`,
      muscle_groups: SPLIT_MUSCLE_GROUPS[split as WorkoutSplit],
      exercises: exercises.map((ex) => ({
        name: ex.name,
        default_sets: ex.default_sets,
        default_reps: ex.default_reps,
        muscle_group: ex.muscle_group,
      })),
    };

    let { data: template, error } = await supabase
      .from("workout_templates")
      .insert({
        ...templatePayload,
        split,
        is_system: true,
      })
      .select()
      .single();

    if (error && isMissingSchemaError(error)) {
      ({ data: template, error } = await supabase
        .from("workout_templates")
        .insert(templatePayload)
        .select()
        .single());
    }

    if (error || !template) continue;

    const { error: templateExerciseError } = await supabase
      .from("workout_template_exercises")
      .insert(
        exercises.map((ex, i) => ({
          template_id: template.id,
          user_id: userId,
          exercise_name: ex.name,
          muscle_group: ex.muscle_group,
          default_sets: ex.default_sets,
          default_reps: ex.default_reps,
          sort_order: i,
        })),
      );

    if (templateExerciseError && !isMissingSchemaError(templateExerciseError)) {
      throw templateExerciseError;
    }
  }
}

export async function createWorkout(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = createWorkoutSchema.parse({
    name: formData.get("name"),
    split: formData.get("split") || matchSplitFromName(String(formData.get("name") ?? "")),
    muscle_groups: parseMuscleGroupsInput(formData.get("muscle_groups") as string),
    notes: formData.get("notes"),
    template_id: formData.get("template_id") || null,
    duplicate_from_workout_id: formData.get("duplicate_from_workout_id") || null,
  });

  const split = parsed.split as WorkoutSplit | null;
  const muscleGroups =
    parsed.muscle_groups?.length
      ? parsed.muscle_groups
      : split
        ? SPLIT_MUSCLE_GROUPS[split]
        : [];

  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      name: parsed.name,
      split,
      workout_type: split,
      muscle_groups: muscleGroups,
      notes: parsed.notes,
      template_id: parsed.template_id,
    })
    .select()
    .single();

  if (error) throw error;

  if (parsed.duplicate_from_workout_id) {
    await copyWorkoutExercises(user.id, parsed.duplicate_from_workout_id, workout.id, false);
  } else if (parsed.template_id) {
    await copyTemplateExercises(user.id, parsed.template_id, workout.id);
  }

  revalidateGymPaths(workout.id);
  return workout;
}

async function copyTemplateExercises(
  userId: string,
  templateId: string,
  workoutId: string,
) {
  const supabase = await createClient();
  const template = await getTemplate(templateId);
  if (!template) return;

  const exercises = template.workout_template_exercises ?? template.exercises ?? [];
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i];
    await supabase.from("workout_exercises").insert({
      user_id: userId,
      workout_id: workoutId,
      exercise_name: ex.exercise_name ?? (ex as { name?: string }).name,
      muscle_group: ex.muscle_group,
      sort_order: ex.sort_order ?? i,
      notes: ex.notes,
    });
  }
}

async function copyWorkoutExercises(
  userId: string,
  sourceWorkoutId: string,
  targetWorkoutId: string,
  copySets: boolean,
) {
  const supabase = await createClient();
  const source = await getWorkout(sourceWorkoutId);
  if (!source) return;

  const exercises = source.workout_exercises?.length
    ? source.workout_exercises
    : [];

  if (exercises.length === 0 && source.workout_sets?.length) {
    const names = [...new Set(source.workout_sets.map((s) => s.exercise_name))];
    for (let i = 0; i < names.length; i++) {
      const { data: ex } = await supabase
        .from("workout_exercises")
        .insert({
          user_id: userId,
          workout_id: targetWorkoutId,
          exercise_name: names[i],
          sort_order: i,
        })
        .select()
        .single();

      if (copySets && ex) {
        const sets = source.workout_sets!.filter((s) => s.exercise_name === names[i]);
        for (const set of sets) {
          await supabase.from("workout_sets").insert({
            user_id: userId,
            workout_id: targetWorkoutId,
            workout_exercise_id: ex.id,
            exercise_name: set.exercise_name,
            set_number: set.set_number,
            reps: set.reps,
            weight: set.weight,
            unit: set.unit,
            rpe: set.rpe,
            is_warmup: set.is_warmup,
            sort_order: set.set_number,
          });
        }
      }
    }
    return;
  }

  for (const ex of exercises) {
    const { data: newEx } = await supabase
      .from("workout_exercises")
      .insert({
        user_id: userId,
        workout_id: targetWorkoutId,
        exercise_library_id: ex.exercise_library_id,
        exercise_name: ex.exercise_name,
        muscle_group: ex.muscle_group,
        sort_order: ex.sort_order,
        notes: ex.notes,
      })
      .select()
      .single();

    if (copySets && newEx && ex.workout_sets?.length) {
      for (const set of ex.workout_sets) {
        await supabase.from("workout_sets").insert({
          user_id: userId,
          workout_id: targetWorkoutId,
          workout_exercise_id: newEx.id,
          exercise_name: set.exercise_name,
          set_number: set.set_number,
          reps: set.reps,
          weight: set.weight,
          unit: set.unit,
          rpe: set.rpe,
          is_warmup: set.is_warmup,
          rest_seconds: set.rest_seconds,
          sort_order: set.set_number,
          notes: set.notes,
        });
      }
    }
  }
}

export async function duplicateWorkoutAsNew(
  sourceId: string,
  options: { copySets?: boolean; name?: string } = {},
) {
  const user = await requireUser();
  const supabase = await createClient();
  const source = await getWorkout(sourceId);

  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      name: options.name ?? `${source.name} (copy)`,
      split: source.split,
      workout_type: source.split,
      muscle_groups: source.muscle_groups,
      template_id: source.template_id,
    })
    .select()
    .single();

  if (error) throw error;
  await copyWorkoutExercises(user.id, sourceId, workout.id, options.copySets ?? true);
  revalidateGymPaths(workout.id);
  return workout;
}

export async function addWorkoutExercise(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = addExerciseSchema.parse({
    workout_id: formData.get("workout_id"),
    exercise_name: formData.get("exercise_name"),
    muscle_group: formData.get("muscle_group"),
    exercise_library_id: formData.get("exercise_library_id"),
  });

  const { count } = await supabase
    .from("workout_exercises")
    .select("*", { count: "exact", head: true })
    .eq("workout_id", parsed.workout_id);

  const { data, error } = await supabase
    .from("workout_exercises")
    .insert({
      user_id: user.id,
      workout_id: parsed.workout_id,
      exercise_name: parsed.exercise_name,
      muscle_group: parsed.muscle_group,
      exercise_library_id: parsed.exercise_library_id,
      sort_order: count ?? 0,
    })
    .select()
    .single();

  if (error) throw error;
  revalidateGymPaths(parsed.workout_id);
  return data;
}

export async function removeWorkoutExercise(exerciseId: string, workoutId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("workout_exercises")
    .delete()
    .eq("id", exerciseId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidateGymPaths(workoutId);
}

export async function reorderExercises(
  workoutId: string,
  orderedIds: string[],
) {
  const user = await requireUser();
  const supabase = await createClient();

  for (let i = 0; i < orderedIds.length; i++) {
    await supabase
      .from("workout_exercises")
      .update({ sort_order: i })
      .eq("id", orderedIds[i])
      .eq("user_id", user.id);
  }

  revalidateGymPaths(workoutId);
}

export async function addWorkoutSet(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = addSetSchema.parse({
    workout_id: formData.get("workout_id"),
    workout_exercise_id: formData.get("workout_exercise_id"),
    exercise_name: formData.get("exercise_name"),
    set_number: formData.get("set_number"),
    reps: formData.get("reps"),
    weight: formData.get("weight"),
    rpe: formData.get("rpe"),
    is_warmup: formData.get("is_warmup") === "true",
    rest_seconds: formData.get("rest_seconds"),
    notes: formData.get("notes"),
    unit: formData.get("unit") || "lbs",
  });

  const { data, error } = await supabase
    .from("workout_sets")
    .insert({
      user_id: user.id,
      workout_id: parsed.workout_id,
      workout_exercise_id: parsed.workout_exercise_id,
      exercise_name: parsed.exercise_name,
      set_number: parsed.set_number!,
      reps: parsed.reps,
      weight: parsed.weight,
      unit: parsed.unit ?? "lbs",
      rpe: parsed.rpe,
      is_warmup: parsed.is_warmup ?? false,
      rest_seconds: parsed.rest_seconds,
      notes: parsed.notes,
      sort_order: parsed.set_number!,
    })
    .select()
    .single();

  if (error) throw error;
  revalidateGymPaths(parsed.workout_id);
  return data;
}

export async function updateWorkoutSet(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const setId = formData.get("set_id") as string;
  const workoutId = formData.get("workout_id") as string;

  const parsed = updateSetSchema.parse({
    set_id: setId,
    reps: formData.get("reps"),
    weight: formData.get("weight"),
    rpe: formData.get("rpe"),
    is_warmup: formData.get("is_warmup") === "true",
    rest_seconds: formData.get("rest_seconds"),
    notes: formData.get("notes"),
  });

  const { error } = await supabase
    .from("workout_sets")
    .update({
      reps: parsed.reps,
      weight: parsed.weight,
      rpe: parsed.rpe,
      is_warmup: parsed.is_warmup,
      rest_seconds: parsed.rest_seconds,
      notes: parsed.notes,
    })
    .eq("id", setId)
    .eq("user_id", user.id);

  if (error) throw error;

  const workout = await getWorkout(workoutId);
  if (workout.completed_at) {
    await rebuildPRsForWorkout(user.id, workout);
  }

  revalidateGymPaths(workoutId);
}

export async function deleteWorkoutSet(setId: string, workoutId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("workout_sets")
    .delete()
    .eq("id", setId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidateGymPaths(workoutId);
}

export async function duplicateSet(setId: string, workoutId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: source, error: fetchError } = await supabase
    .from("workout_sets")
    .select("*")
    .eq("id", setId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !source) throw fetchError ?? new Error("Set not found");

  const { count } = await supabase
    .from("workout_sets")
    .select("*", { count: "exact", head: true })
    .eq("workout_exercise_id", source.workout_exercise_id);

  const nextSetNumber = (count ?? 0) + 1;

  const { data, error } = await supabase
    .from("workout_sets")
    .insert({
      user_id: user.id,
      workout_id: source.workout_id,
      workout_exercise_id: source.workout_exercise_id,
      exercise_name: source.exercise_name,
      set_number: nextSetNumber,
      reps: source.reps,
      weight: source.weight,
      unit: source.unit,
      rpe: source.rpe,
      is_warmup: source.is_warmup,
      rest_seconds: source.rest_seconds,
      sort_order: nextSetNumber,
    })
    .select()
    .single();

  if (error) throw error;
  revalidateGymPaths(workoutId);
  return data;
}

async function rebuildPRsForWorkout(userId: string, workout: Workout) {
  const supabase = await createClient();
  const sets = workout.workout_sets ?? [];

  const { data: existingPRs, error: existingError } = await supabase
    .from("exercise_personal_records")
    .select("*")
    .eq("user_id", userId);

  if (existingError && isMissingSchemaError(existingError)) return;
  if (existingError) throw existingError;

  const detected = detectPRsFromSets(sets, (existingPRs ?? []) as ExercisePersonalRecord[]);
  const achievedAt = workout.completed_at ?? new Date().toISOString();

  for (const pr of detected) {
    await supabase.from("exercise_personal_records").upsert(
      {
        user_id: userId,
        exercise_name: pr.exercise_name,
        record_type: pr.record_type,
        value: pr.value,
        reps: pr.reps,
        weight: pr.weight,
        achieved_at: achievedAt,
        workout_id: workout.id,
        set_id: pr.set_id,
      },
      { onConflict: "user_id,exercise_name,record_type" },
    );
  }
}

export async function completeWorkout(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = completeWorkoutSchema.parse({
    workout_id: formData.get("workout_id"),
    notes: formData.get("notes"),
    overall_rpe: formData.get("overall_rpe"),
    body_weight: formData.get("body_weight"),
  });

  const endedAt = new Date().toISOString();
  const workout = await getWorkout(parsed.workout_id);
  const durationSeconds = workoutDuration(workout.started_at, endedAt);

  const fullUpdate = {
    completed_at: endedAt,
    ended_at: endedAt,
    notes: parsed.notes ?? workout.notes,
    overall_rpe: parsed.overall_rpe,
    body_weight: parsed.body_weight,
    duration_seconds: durationSeconds,
  };

  let { error } = await supabase
    .from("workouts")
    .update(fullUpdate)
    .eq("id", parsed.workout_id)
    .eq("user_id", user.id);

  if (error && isMissingSchemaError(error)) {
    ({ error } = await supabase
      .from("workouts")
      .update({
        completed_at: endedAt,
        notes: parsed.notes ?? workout.notes,
      })
      .eq("id", parsed.workout_id)
      .eq("user_id", user.id));
  }

  if (error) throw error;

  if (parsed.body_weight) {
    const { error: bodyWeightError } = await supabase.from("body_weight_logs").upsert(
      {
        user_id: user.id,
        logged_date: format(new Date(), "yyyy-MM-dd"),
        weight: parsed.body_weight,
        workout_id: parsed.workout_id,
        source: "workout",
      },
      { onConflict: "user_id,logged_date,source" },
    );
  }

  const updated = await getWorkout(parsed.workout_id);
  await rebuildPRsForWorkout(user.id, updated);

  revalidateGymPaths(parsed.workout_id);
}

export async function deleteWorkout(workoutId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidateGymPaths();
}

export async function startWorkoutFromTemplate(templateId: string) {
  const template = await getTemplate(templateId);
  if (!template) throw new Error("Template not found");

  const formData = new FormData();
  formData.set("name", template.name.replace(" Template", " Day"));
  formData.set("split", template.split ?? "");
  formData.set("template_id", templateId);
  return createWorkout(formData);
}

export async function createWorkoutTemplate(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const exercisesRaw = formData.get("exercises") as string;
  const exercises = JSON.parse(exercisesRaw);

  const parsed = createTemplateSchema.parse({
    name: formData.get("name"),
    split: formData.get("split") || null,
    muscle_groups: parseMuscleGroupsInput(formData.get("muscle_groups") as string),
    exercises,
  });

  const { data: template, error } = await supabase
    .from("workout_templates")
    .insert({
      user_id: user.id,
      name: parsed.name,
      split: parsed.split,
      muscle_groups: parsed.muscle_groups ?? [],
      exercises: parsed.exercises,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase.from("workout_template_exercises").insert(
    parsed.exercises.map((ex, i) => ({
      template_id: template.id,
      user_id: user.id,
      exercise_library_id: ex.exercise_library_id ?? null,
      exercise_name: ex.exercise_name,
      muscle_group: ex.muscle_group,
      default_sets: ex.default_sets,
      default_reps: ex.default_reps,
      sort_order: i,
      notes: ex.notes,
    })),
  );

  revalidateGymPaths();
  return template;
}

export async function updateWorkoutTemplate(
  templateId: string,
  formData: FormData,
) {
  const user = await requireUser();
  const supabase = await createClient();

  const exercisesRaw = formData.get("exercises") as string;
  const exercises = JSON.parse(exercisesRaw);

  const parsed = createTemplateSchema.parse({
    name: formData.get("name"),
    split: formData.get("split") || null,
    muscle_groups: parseMuscleGroupsInput(formData.get("muscle_groups") as string),
    exercises,
  });

  const { error } = await supabase
    .from("workout_templates")
    .update({
      name: parsed.name,
      split: parsed.split,
      muscle_groups: parsed.muscle_groups ?? [],
      exercises: parsed.exercises,
    })
    .eq("id", templateId)
    .eq("user_id", user.id);

  if (error) throw error;

  await supabase
    .from("workout_template_exercises")
    .delete()
    .eq("template_id", templateId);

  await supabase.from("workout_template_exercises").insert(
    parsed.exercises.map((ex, i) => ({
      template_id: templateId,
      user_id: user.id,
      exercise_library_id: ex.exercise_library_id ?? null,
      exercise_name: ex.exercise_name,
      muscle_group: ex.muscle_group,
      default_sets: ex.default_sets,
      default_reps: ex.default_reps,
      sort_order: i,
      notes: ex.notes,
    })),
  );

  revalidateGymPaths();
}

export async function deleteWorkoutTemplate(templateId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("workout_templates")
    .delete()
    .eq("id", templateId)
    .eq("user_id", user.id)
    .eq("is_system", false);

  if (error) throw error;
  revalidateGymPaths();
}

export async function logBodyWeight(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = bodyWeightSchema.parse({
    logged_date: formData.get("logged_date"),
    weight: formData.get("weight"),
    notes: formData.get("notes"),
    workout_id: formData.get("workout_id") || null,
  });

  const { error } = await supabase.from("body_weight_logs").upsert(
    {
      user_id: user.id,
      logged_date: parsed.logged_date,
      weight: parsed.weight!,
      notes: parsed.notes,
      workout_id: parsed.workout_id,
      source: "manual",
    },
    { onConflict: "user_id,logged_date,source" },
  );

  if (error) throw error;
  revalidateGymPaths();
}

export async function createCustomExercise(name: string, muscleGroup: string) {
  const { createCustomExercise: create } = await import(
    "@/lib/actions/exercise-library"
  );
  return create(name, muscleGroup);
}

export async function getLastWorkoutByMuscleGroup(muscleGroup: string) {
  const user = await requireUser();
  const supabase = await createClient();
  const select = await resolveWorkoutSelect(supabase);

  let { data, error } = await supabase
    .from("workouts")
    .select(select)
    .eq("user_id", user.id)
    .contains("muscle_groups", [muscleGroup])
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && isMissingSchemaError(error)) {
    cachedUsesFullGymSchema = false;
    ({ data, error } = await supabase
      .from("workouts")
      .select(LEGACY_WORKOUT_SELECT)
      .eq("user_id", user.id)
      .contains("muscle_groups", [muscleGroup])
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle());
  }
  if (error) throw error;
  return data ? sortWorkoutData(data as unknown as Workout) : null;
}

export { enrichWorkout };
