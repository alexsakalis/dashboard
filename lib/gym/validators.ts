import { z } from "zod";
import {
  WORKOUT_SPLITS,
  BODY_PARTS,
  EQUIPMENT_TYPES,
  DIFFICULTY_LEVELS,
  MOVEMENT_TYPES,
  MOVEMENT_PATTERNS,
} from "@/lib/gym/constants";

const optionalNumber = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined || String(val).trim() === "")
      return null;
    const n = Number.parseFloat(String(val));
    if (!Number.isFinite(n)) throw new Error("Invalid number");
    return n;
  });

const optionalInt = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined || String(val).trim() === "")
      return null;
    const n = Number.parseInt(String(val), 10);
    if (!Number.isFinite(n)) throw new Error("Invalid number");
    return n;
  });

export const workoutSplitSchema = z.enum(WORKOUT_SPLITS as [string, ...string[]]);

export const createWorkoutSchema = z.object({
  name: z.string().trim().min(1, "Workout name is required"),
  split: workoutSplitSchema.optional().nullable(),
  muscle_groups: z.array(z.string()).optional(),
  notes: z.string().trim().optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
  duplicate_from_workout_id: z.string().uuid().optional().nullable(),
});

export const addExerciseSchema = z.object({
  workout_id: z.string().uuid(),
  exercise_name: z.string().trim().min(1, "Exercise name is required"),
  muscle_group: z.string().trim().optional().nullable(),
  exercise_library_id: z.string().uuid().optional().nullable(),
});

export const addSetSchema = z.object({
  workout_id: z.string().uuid(),
  workout_exercise_id: z.string().uuid(),
  exercise_name: z.string().trim().min(1),
  set_number: optionalInt.refine((n) => n !== null && n >= 1, "Set number required"),
  reps: optionalInt.refine((n) => n === null || n >= 0, "Reps must be zero or greater"),
  weight: optionalNumber.refine(
    (n) => n === null || n >= 0,
    "Weight must be zero or greater",
  ),
  rpe: optionalNumber.refine(
    (n) => n === null || (n >= 1 && n <= 10),
    "RPE must be between 1 and 10",
  ),
  is_warmup: z.boolean().optional(),
  rest_seconds: optionalInt.refine(
    (n) => n === null || n >= 0,
    "Rest must be zero or greater",
  ),
  notes: z.string().trim().optional().nullable(),
  unit: z.string().optional(),
});

export const updateSetSchema = addSetSchema.partial().extend({
  set_id: z.string().uuid(),
});

export const completeWorkoutSchema = z.object({
  workout_id: z.string().uuid(),
  notes: z.string().trim().optional().nullable(),
  overall_rpe: optionalNumber.refine(
    (n) => n === null || (n >= 1 && n <= 10),
    "RPE must be between 1 and 10",
  ),
  body_weight: optionalNumber.refine(
    (n) => n === null || (n > 0 && n < 1000),
    "Invalid body weight",
  ),
});

export const bodyWeightSchema = z.object({
  logged_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight: optionalNumber.refine((n) => n !== null && n > 0, "Weight is required"),
  notes: z.string().trim().optional().nullable(),
  workout_id: z.string().uuid().optional().nullable(),
});

export const templateExerciseSchema = z.object({
  exercise_name: z.string().trim().min(1),
  muscle_group: z.string().trim().optional().nullable(),
  exercise_library_id: z.string().uuid().optional().nullable(),
  default_sets: optionalInt.refine((n) => n !== null && n >= 1, "Sets required"),
  default_reps: optionalInt.optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const createTemplateSchema = z.object({
  name: z.string().trim().min(1, "Template name is required"),
  split: workoutSplitSchema.optional().nullable(),
  muscle_groups: z.array(z.string()).optional(),
  exercises: z.array(templateExerciseSchema).min(1, "Add at least one exercise"),
});

export function parseMuscleGroupsInput(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw.split(",").map((g) => g.trim().toLowerCase()).filter(Boolean);
}

export const createCustomExerciseSchema = z.object({
  name: z.string().trim().min(1, "Exercise name is required"),
  body_part: z.enum(BODY_PARTS as unknown as [string, ...string[]]),
  muscle_group: z.string().trim().min(1, "Primary muscle is required"),
  secondary_muscle_groups: z.array(z.string()).optional().default([]),
  equipment: z.enum(EQUIPMENT_TYPES as unknown as [string, ...string[]]).optional().nullable(),
  movement_pattern: z
    .enum(MOVEMENT_PATTERNS as unknown as [string, ...string[]])
    .optional()
    .nullable(),
  movement_type: z
    .enum(MOVEMENT_TYPES as unknown as [string, ...string[]])
    .optional()
    .nullable(),
  difficulty: z
    .enum(DIFFICULTY_LEVELS as unknown as [string, ...string[]])
    .optional()
    .nullable(),
  instructions: z.string().trim().optional().nullable(),
});

export const updateCustomExerciseSchema = createCustomExerciseSchema.partial().extend({
  id: z.string().uuid(),
});
