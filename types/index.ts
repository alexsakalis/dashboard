export type TaskStatus = "todo" | "done" | "archived";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type RecurrenceFrequency = "daily" | "weekly" | "monthly";
export type IntegrationProvider = "oura" | "google" | "apple_health";
export type HealthSource = "oura" | "apple_health";
export type SyncLogStatus = "running" | "success" | "error" | "skipped";
export type SyncTrigger = "cron" | "manual" | "oauth";
export type ProviderSyncStatus = "success" | "error" | "skipped";
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
    description?: string | null;
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
  activity_score: number | null;
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
  display_name: string | null;
  enabled: boolean;
  access_token_enc: string | null;
  refresh_token_enc: string | null;
  token_expires_at: string | null;
  config: Record<string, unknown>;
  status: "active" | "reauth_required" | "error";
  last_synced_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  last_message: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface IntegrationSyncLog {
  id: string;
  integration_id: string | null;
  user_id: string;
  provider: string;
  status: SyncLogStatus;
  message: string | null;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  metadata: Record<string, unknown>;
}

export interface DashboardCardData {
  tasks_preview: Array<{
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    due_date: string | null;
    task_categories?: { name: string; color: string } | null;
  }>;
  habits_preview: Array<{
    id: string;
    name: string;
    icon: string | null;
    completed_today: boolean;
    streak: number;
  }>;
  calendar_preview: Array<{
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    all_day: boolean;
    location: string | null;
  }>;
  integrations_status: Array<{
    provider: string;
    display_name: string;
    status: string;
    last_sync_at: string | null;
    last_message: string | null;
    duration_ms: number | null;
  }>;
  gym_last_workout: {
    id: string;
    name: string;
    started_at: string;
    split: string | null;
  } | null;
  finance: {
    card_count: number;
    total_owed: number;
    total_minimum: number;
    overall_utilization: number | null;
    due_soon_count: number;
    paid_this_month: number;
  } | null;
  daily_score_detail: {
    task_points: number;
    habit_points: number;
    streak_bonus: number;
    total_score: number;
    tasks_completed: number;
    habits_completed: number;
  };
}

export interface DashboardSummary {
  user_id: string;
  sleep_score: number | null;
  readiness_score: number | null;
  activity_score: number | null;
  latest_hrv: number | null;
  resting_hr: number | null;
  sleep_duration_min: number | null;
  steps: number | null;
  tasks_due_today: number;
  tasks_completed_today: number;
  habit_score: number | null;
  daily_score: number | null;
  score_streak: number | null;
  weekly_workouts: number;
  latest_body_weight: number | null;
  gym_streak: number;
  credit_card_balance: number | null;
  credit_utilization: number | null;
  minimum_due: number | null;
  calendar_events_today: number;
  last_sync: string | null;
  card_data: DashboardCardData;
  updated_at: string;
}

export interface SyncResult {
  provider: string;
  status: ProviderSyncStatus;
  message: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
}

export interface RunSummary {
  success: boolean;
  durationMs: number;
  usersProcessed: number;
  results: SyncResult[];
  errors: string[];
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
  activity_score: number | null;
}
