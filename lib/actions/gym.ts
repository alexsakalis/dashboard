"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutTemplateExercise } from "@/types";

export async function getWorkouts(limit = 10) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workouts")
    .select("*, workout_sets(*)")
    .eq("user_id", user.id)
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function getLastWorkoutByMuscleGroup(muscleGroup: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workouts")
    .select("*, workout_sets(*)")
    .eq("user_id", user.id)
    .contains("muscle_groups", [muscleGroup])
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getWorkoutTemplates() {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  if (error) throw error;
  return data ?? [];
}

export async function createWorkout(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const workoutType = (formData.get("workout_type") as string) || null;
  const muscleGroupsRaw = formData.get("muscle_groups") as string;
  const muscleGroups = muscleGroupsRaw
    ? muscleGroupsRaw.split(",").map((g) => g.trim())
    : [];
  const notes = (formData.get("notes") as string) || null;
  const templateId = (formData.get("template_id") as string) || null;

  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({
      user_id: user.id,
      name,
      workout_type: workoutType,
      muscle_groups: muscleGroups,
      notes,
      template_id: templateId || null,
    })
    .select()
    .single();

  if (error) throw error;
  revalidatePath("/gym");
  return workout;
}

export async function addWorkoutSet(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const workoutId = formData.get("workout_id") as string;
  const exerciseName = formData.get("exercise_name") as string;
  const setNumber = parseInt(formData.get("set_number") as string, 10);
  const repsRaw = formData.get("reps") as string;
  const weightRaw = formData.get("weight") as string;
  const reps =
    repsRaw === "" || repsRaw == null ? null : parseInt(repsRaw, 10);
  const weight =
    weightRaw === "" || weightRaw == null ? null : parseFloat(weightRaw);
  const notes = (formData.get("notes") as string) || null;

  const { error } = await supabase.from("workout_sets").insert({
    user_id: user.id,
    workout_id: workoutId,
    exercise_name: exerciseName,
    set_number: setNumber,
    reps,
    weight,
    notes,
  });

  if (error) throw error;
  revalidatePath("/gym");
}

export async function completeWorkout(workoutId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("workouts")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", workoutId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/gym");
}

export async function createWorkoutTemplate(
  name: string,
  muscleGroups: string[],
  exercises: WorkoutTemplateExercise[],
) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("workout_templates").insert({
    user_id: user.id,
    name,
    muscle_groups: muscleGroups,
    exercises,
  });

  if (error) throw error;
  revalidatePath("/gym/templates");
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
  revalidatePath("/gym");
}
