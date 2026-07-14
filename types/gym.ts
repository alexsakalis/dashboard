export type WorkoutSplit =
  | "push"
  | "pull"
  | "legs"
  | "upper"
  | "lower"
  | "full_body"
  | "custom";

export type RecordType =
  | "max_weight"
  | "max_reps"
  | "estimated_1rm"
  | "max_volume_set";

export type BodyWeightSource = "manual" | "apple_health" | "workout";

export type ProgressTrend = "improving" | "flat" | "declining";

export type ProgressionStatus = "improved" | "stalled" | "regressed" | "new";

export type BodyPart =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "traps"
  | "neck"
  | "cardio"
  | "full_body";

export type EquipmentType =
  | "barbell"
  | "dumbbell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "kettlebell"
  | "band"
  | "cardio_machine"
  | "other";

export type DifficultyLevel = "beginner" | "intermediate" | "advanced";

export type MovementType = "compound" | "isolation";

export type MovementPattern =
  | "horizontal_push"
  | "vertical_push"
  | "horizontal_pull"
  | "vertical_pull"
  | "hinge"
  | "squat"
  | "lunge"
  | "carry"
  | "rotation"
  | "isolation"
  | "cardio"
  | "other";

export interface ExerciseLibraryEntry {
  id: string;
  user_id: string | null;
  name: string;
  body_part: BodyPart;
  muscle_group: string;
  secondary_muscle_groups: string[];
  equipment: string | null;
  movement_pattern: MovementPattern | null;
  movement_type: MovementType | null;
  difficulty: DifficultyLevel | null;
  split_tags: string[];
  instructions: string | null;
  aliases: string[];
  is_custom: boolean;
  created_at: string;
}

export interface ExerciseUserPreferences {
  id: string;
  user_id: string;
  exercise_library_id: string;
  is_favorite: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface EnrichedExerciseLibraryEntry extends ExerciseLibraryEntry {
  is_favorite: boolean;
  is_hidden: boolean;
  usage_count?: number;
}

export interface ExerciseLibraryFilters {
  query?: string;
  bodyPart?: BodyPart | "all";
  equipment?: EquipmentType | "all";
  difficulty?: DifficultyLevel | "all";
  split?: WorkoutSplit | "all";
  movementType?: MovementType | "all";
  favoritesOnly?: boolean;
  includeHidden?: boolean;
  limit?: number;
}

export interface WorkoutExercise {
  id: string;
  user_id: string;
  workout_id: string;
  exercise_library_id: string | null;
  exercise_name: string;
  muscle_group: string | null;
  sort_order: number;
  notes: string | null;
  created_at: string;
  workout_sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  user_id: string;
  workout_id: string;
  workout_exercise_id: string | null;
  exercise_name: string;
  set_number: number;
  reps: number | null;
  weight: number | null;
  unit: string;
  rpe: number | null;
  is_warmup: boolean;
  rest_seconds: number | null;
  sort_order: number;
  notes: string | null;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  name: string;
  workout_type: string | null;
  split: WorkoutSplit | null;
  muscle_groups: string[];
  started_at: string;
  completed_at: string | null;
  ended_at: string | null;
  overall_rpe: number | null;
  body_weight: number | null;
  body_weight_unit: string;
  duration_seconds: number | null;
  notes: string | null;
  template_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  workout_exercises?: WorkoutExercise[];
  workout_sets?: WorkoutSet[];
}

export interface WorkoutTemplateExercise {
  id?: string;
  template_id?: string;
  user_id?: string;
  exercise_library_id?: string | null;
  exercise_name: string;
  muscle_group?: string | null;
  default_sets: number;
  default_reps?: number | null;
  sort_order?: number;
  notes?: string | null;
}

export interface WorkoutTemplate {
  id: string;
  user_id: string;
  name: string;
  split: WorkoutSplit | null;
  muscle_groups: string[];
  exercises: WorkoutTemplateExercise[];
  is_system: boolean;
  created_at: string;
  workout_template_exercises?: WorkoutTemplateExercise[];
}

export interface BodyWeightLog {
  id: string;
  user_id: string;
  logged_date: string;
  weight: number;
  unit: string;
  workout_id: string | null;
  source: BodyWeightSource;
  notes: string | null;
  created_at: string;
}

export interface ExercisePersonalRecord {
  id: string;
  user_id: string;
  exercise_name: string;
  record_type: RecordType;
  value: number;
  reps: number | null;
  weight: number | null;
  achieved_at: string;
  workout_id: string | null;
  set_id: string | null;
}

export interface GymPreferences {
  user_id: string;
  default_weight_unit: string;
  default_rest_seconds: number;
  preferred_splits: string[];
  updated_at: string;
}

export interface EnrichedWorkout extends Workout {
  totalVolume: number;
  totalSets: number;
  workingSets: number;
  durationLabel: string | null;
}

export interface GymDashboardSummary {
  lastWorkout: EnrichedWorkout | null;
  suggestedSplit: WorkoutSplit;
  weeklyWorkoutCount: number;
  trainingStreak: number;
  latestBodyWeight: BodyWeightLog | null;
  recentPRs: ExercisePersonalRecord[];
  topProgressing: ExerciseProgressSummary[];
  weightUnit: string;
}

export interface LastWorkoutReference {
  workoutId: string;
  workoutName: string;
  completedAt: string;
  exercises: {
    exerciseName: string;
    muscleGroup: string | null;
    sets: { reps: number | null; weight: number | null; isWarmup: boolean }[];
  }[];
}

export interface ProgressionHint {
  exerciseName: string;
  status: ProgressionStatus;
  suggestedWeight: number | null;
  lastSets: { reps: number | null; weight: number | null }[];
  message: string;
}

export interface ProgressChartPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ExerciseProgressSummary {
  exerciseName: string;
  bestSet: { weight: number; reps: number; estimated1RM: number } | null;
  estimated1RM: number | null;
  totalVolume: number;
  trend: ProgressTrend;
  recentPR: ExercisePersonalRecord | null;
  chartPoints: ProgressChartPoint[];
}

export interface WorkoutFilters {
  split?: WorkoutSplit;
  limit?: number;
  completedOnly?: boolean;
}
