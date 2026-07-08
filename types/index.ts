export type TaskStatus = "todo" | "done" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly";
export type IntegrationProvider = "oura" | "google";
export type HealthSource = "oura";
export type ScoreEventType =
  | "task_complete"
  | "habit_complete"
  | "streak_bonus"
  | "recurring_bonus";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  points_awarded: number;
  recurrence_rule_id: string | null;
  created_at: string;
  updated_at: string;
  task_categories?: TaskCategory | null;
}

export interface TaskCategory {
  id: string;
  user_id: string;
  name: string;
  color: string;
  icon: string | null;
}

export interface RecurrenceRule {
  id: string;
  user_id: string;
  frequency: RecurrenceFrequency;
  interval: number;
  days_of_week: number[] | null;
  next_occurrence: string | null;
  template_task: {
    title: string;
    priority: TaskPriority;
    category_id?: string | null;
  };
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string | null;
  frequency: string;
  points_per_completion: number;
  sort_order: number;
  active: boolean;
}

export interface HabitCompletion {
  id: string;
  user_id: string;
  habit_id: string;
  completed_date: string;
}

export type {
  WorkoutSplit,
  RecordType,
  BodyWeightSource,
  ProgressTrend,
  ProgressionStatus,
  BodyPart,
  EquipmentType,
  DifficultyLevel,
  MovementType,
  MovementPattern,
  ExerciseLibraryEntry,
  ExerciseUserPreferences,
  EnrichedExerciseLibraryEntry,
  ExerciseLibraryFilters,
  WorkoutExercise,
  WorkoutSet,
  Workout,
  WorkoutTemplateExercise,
  WorkoutTemplate,
  BodyWeightLog,
  ExercisePersonalRecord,
  GymPreferences,
  EnrichedWorkout,
  GymDashboardSummary,
  LastWorkoutReference,
  ProgressionHint,
  ProgressChartPoint,
  ExerciseProgressSummary,
  WorkoutFilters,
} from "@/types/gym";

export interface HealthDailySnapshot {
  id: string;
  user_id: string;
  date: string;
  source: HealthSource;
  sleep_score: number | null;
  sleep_duration_min: number | null;
  readiness_score: number | null;
  hrv_ms: number | null;
  resting_hr: number | null;
  steps: number | null;
  active_calories: number | null;
  workout_count: number | null;
  synced_at: string;
}

export type {
  CardStatus,
  PaymentStatus,
  PaymentMethod,
  CreditCard,
  CreditCardPayment,
  CreditCardBalanceSnapshot,
  FinancePreferences,
  EnrichedCreditCard,
  CreditCardPortfolioSummary,
  CreditCardSummary,
  PaySuggestion,
  BalanceChartPoint,
} from "@/types/finance";

export interface DailyScore {
  id: string;
  user_id: string;
  date: string;
  task_points: number;
  habit_points: number;
  streak_bonus: number;
  total_score: number;
  tasks_completed: number;
  habits_completed: number;
}

export interface Integration {
  id: string;
  user_id: string;
  provider: IntegrationProvider;
  access_token_enc: string | null;
  refresh_token_enc: string | null;
  token_expires_at: string | null;
  config: Record<string, unknown>;
  status: "active" | "reauth_required" | "error";
  last_synced_at: string | null;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  external_id: string;
  title: string;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string | null;
  source: string;
  synced_at: string;
}

export interface CombinedHealthMetrics {
  date: string;
  sleep_score: number | null;
  sleep_duration_min: number | null;
  readiness_score: number | null;
  hrv_ms: number | null;
  resting_hr: number | null;
  steps: number | null;
  active_calories: number | null;
  workout_count: number | null;
}
