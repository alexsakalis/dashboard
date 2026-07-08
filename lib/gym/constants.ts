import type { WorkoutSplit } from "@/types/gym";

export const WORKOUT_SPLITS: WorkoutSplit[] = [
  "push",
  "pull",
  "legs",
  "upper",
  "lower",
  "full_body",
  "custom",
];

export const SPLIT_LABELS: Record<WorkoutSplit, string> = {
  push: "Push",
  pull: "Pull",
  legs: "Legs",
  upper: "Upper",
  lower: "Lower",
  full_body: "Full Body",
  custom: "Custom",
};

export const SPLIT_MUSCLE_GROUPS: Record<WorkoutSplit, string[]> = {
  push: ["chest", "shoulders", "triceps"],
  pull: ["back", "biceps", "forearms", "traps"],
  legs: ["quads", "hamstrings", "glutes", "calves"],
  upper: ["chest", "back", "shoulders", "biceps", "triceps", "forearms", "traps"],
  lower: ["quads", "hamstrings", "glutes", "calves"],
  full_body: ["chest", "back", "quads", "shoulders", "core", "full_body"],
  custom: [],
};

export const BODY_PARTS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "traps",
  "neck",
  "cardio",
  "full_body",
] as const;

export const BODY_PART_LABELS: Record<(typeof BODY_PARTS)[number], string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  core: "Abs/Core",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  traps: "Traps",
  neck: "Neck",
  cardio: "Cardio",
  full_body: "Full Body",
};

export const MUSCLE_GROUPS = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "core",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "traps",
  "neck",
  "cardio",
  "full_body",
] as const;

export const MUSCLE_GROUP_LABELS: Record<(typeof MUSCLE_GROUPS)[number], string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  core: "Core",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
  traps: "Traps",
  neck: "Neck",
  cardio: "Cardio",
  full_body: "Full Body",
};

export const EQUIPMENT_TYPES = [
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "bodyweight",
  "kettlebell",
  "band",
  "cardio_machine",
  "other",
] as const;

export const EQUIPMENT_LABELS: Record<(typeof EQUIPMENT_TYPES)[number], string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  cable: "Cable",
  machine: "Machine",
  bodyweight: "Bodyweight",
  kettlebell: "Kettlebell",
  band: "Band",
  cardio_machine: "Cardio Machine",
  other: "Other",
};

export const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"] as const;

export const DIFFICULTY_LABELS: Record<(typeof DIFFICULTY_LEVELS)[number], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export const MOVEMENT_TYPES = ["compound", "isolation"] as const;

export const MOVEMENT_TYPE_LABELS: Record<(typeof MOVEMENT_TYPES)[number], string> = {
  compound: "Compound",
  isolation: "Isolation",
};

export const MOVEMENT_PATTERNS = [
  "horizontal_push",
  "vertical_push",
  "horizontal_pull",
  "vertical_pull",
  "hinge",
  "squat",
  "lunge",
  "carry",
  "rotation",
  "isolation",
  "cardio",
  "other",
] as const;

export const MOVEMENT_PATTERN_LABELS: Record<(typeof MOVEMENT_PATTERNS)[number], string> = {
  horizontal_push: "Horizontal Push",
  vertical_push: "Vertical Push",
  horizontal_pull: "Horizontal Pull",
  vertical_pull: "Vertical Pull",
  hinge: "Hinge",
  squat: "Squat",
  lunge: "Lunge",
  carry: "Carry",
  rotation: "Rotation",
  isolation: "Isolation",
  cardio: "Cardio",
  other: "Other",
};

export function deriveSplitTags(
  primaryMuscle: string,
  secondaryMuscles: string[] = [],
): string[] {
  const allMuscles = [primaryMuscle, ...secondaryMuscles];
  const tags = new Set<string>();

  for (const [split, muscles] of Object.entries(SPLIT_MUSCLE_GROUPS)) {
    if (split === "custom") continue;
    if (allMuscles.some((m) => muscles.includes(m))) {
      tags.add(split);
    }
  }

  if (primaryMuscle === "full_body" || primaryMuscle === "cardio") {
    tags.add("full_body");
  }

  return [...tags];
}

export const DEFAULT_TEMPLATE_EXERCISES: Record<
  Exclude<WorkoutSplit, "custom">,
  { name: string; muscle_group: string; default_sets: number; default_reps: number }[]
> = {
  push: [
    { name: "Barbell Bench Press", muscle_group: "chest", default_sets: 4, default_reps: 8 },
    { name: "Incline Dumbbell Press", muscle_group: "chest", default_sets: 3, default_reps: 10 },
    { name: "Overhead Press", muscle_group: "shoulders", default_sets: 3, default_reps: 8 },
    { name: "Lateral Raise", muscle_group: "shoulders", default_sets: 3, default_reps: 12 },
    { name: "Tricep Pushdown", muscle_group: "triceps", default_sets: 3, default_reps: 12 },
  ],
  pull: [
    { name: "Pull-Up", muscle_group: "back", default_sets: 4, default_reps: 8 },
    { name: "Barbell Row", muscle_group: "back", default_sets: 3, default_reps: 8 },
    { name: "Lat Pulldown", muscle_group: "back", default_sets: 3, default_reps: 10 },
    { name: "Face Pull", muscle_group: "shoulders", default_sets: 3, default_reps: 15 },
    { name: "Barbell Curl", muscle_group: "biceps", default_sets: 3, default_reps: 10 },
  ],
  legs: [
    { name: "Barbell Squat", muscle_group: "quads", default_sets: 4, default_reps: 6 },
    { name: "Romanian Deadlift", muscle_group: "hamstrings", default_sets: 3, default_reps: 8 },
    { name: "Leg Press", muscle_group: "quads", default_sets: 3, default_reps: 10 },
    { name: "Leg Curl", muscle_group: "hamstrings", default_sets: 3, default_reps: 12 },
    { name: "Calf Raise", muscle_group: "calves", default_sets: 4, default_reps: 12 },
  ],
  upper: [
    { name: "Barbell Bench Press", muscle_group: "chest", default_sets: 3, default_reps: 8 },
    { name: "Barbell Row", muscle_group: "back", default_sets: 3, default_reps: 8 },
    { name: "Overhead Press", muscle_group: "shoulders", default_sets: 3, default_reps: 8 },
    { name: "Barbell Curl", muscle_group: "biceps", default_sets: 3, default_reps: 10 },
    { name: "Tricep Pushdown", muscle_group: "triceps", default_sets: 3, default_reps: 12 },
  ],
  lower: [
    { name: "Barbell Squat", muscle_group: "quads", default_sets: 4, default_reps: 6 },
    { name: "Romanian Deadlift", muscle_group: "hamstrings", default_sets: 3, default_reps: 8 },
    { name: "Walking Lunge", muscle_group: "quads", default_sets: 3, default_reps: 10 },
    { name: "Hip Thrust", muscle_group: "glutes", default_sets: 3, default_reps: 10 },
    { name: "Calf Raise", muscle_group: "calves", default_sets: 4, default_reps: 12 },
  ],
  full_body: [
    { name: "Barbell Squat", muscle_group: "quads", default_sets: 3, default_reps: 8 },
    { name: "Barbell Bench Press", muscle_group: "chest", default_sets: 3, default_reps: 8 },
    { name: "Barbell Row", muscle_group: "back", default_sets: 3, default_reps: 8 },
    { name: "Overhead Press", muscle_group: "shoulders", default_sets: 3, default_reps: 8 },
    { name: "Plank", muscle_group: "core", default_sets: 3, default_reps: 60 },
  ],
};

export const WEIGHT_INCREMENT_LBS = 5;
