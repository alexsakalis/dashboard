import {
  endOfDay,
  format,
  startOfDay,
} from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import { filterCreditCards } from "@/lib/finance/cards";
import {
  buildPortfolioSummary,
  enrichCreditCards,
} from "@/lib/finance/enrich";
import { trainingStreak, weeklyWorkoutCount } from "@/lib/gym/progress";
import { getProviderDisplayName } from "@/lib/integrations/registry";
import { createAdminClient } from "@/lib/server/supabase-admin";
import type {
  CreditCard,
  CreditCardPayment,
  DashboardCardData,
  DashboardSummary,
  Workout,
} from "@/types";

type SupabaseQueryResult = {
  error: { message?: string } | null;
};

function emptyCardData(): DashboardCardData {
  return {
    tasks_preview: [],
    habits_preview: [],
    calendar_preview: [],
    integrations_status: [],
    gym_last_workout: null,
    finance: null,
    daily_score_detail: {
      task_points: 0,
      habit_points: 0,
      streak_bonus: 0,
      total_score: 0,
      tasks_completed: 0,
      habits_completed: 0,
    },
  };
}

function assertNoSupabaseErrors(
  results: Array<[label: string, result: SupabaseQueryResult]>,
) {
  const failures = results.filter(([, result]) => result.error);
  if (failures.length === 0) return;

  throw new Error(
    `dashboard_summary refresh source query failed: ${failures
      .map(
        ([label, result]) => `${label}: ${result.error?.message ?? "unknown"}`,
      )
      .join("; ")}`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function arrayOrDefault<T>(value: unknown, fallback: T[]): T[] {
  return Array.isArray(value) ? (value as T[]) : fallback;
}

function normalizeDailyScoreDetail(
  value: unknown,
): DashboardCardData["daily_score_detail"] {
  const defaults = emptyCardData().daily_score_detail;
  if (!isRecord(value)) return defaults;

  return {
    task_points:
      typeof value.task_points === "number"
        ? value.task_points
        : defaults.task_points,
    habit_points:
      typeof value.habit_points === "number"
        ? value.habit_points
        : defaults.habit_points,
    streak_bonus:
      typeof value.streak_bonus === "number"
        ? value.streak_bonus
        : defaults.streak_bonus,
    total_score:
      typeof value.total_score === "number"
        ? value.total_score
        : defaults.total_score,
    tasks_completed:
      typeof value.tasks_completed === "number"
        ? value.tasks_completed
        : defaults.tasks_completed,
    habits_completed:
      typeof value.habits_completed === "number"
        ? value.habits_completed
        : defaults.habits_completed,
  };
}

function normalizeGymLastWorkout(
  value: unknown,
): DashboardCardData["gym_last_workout"] {
  if (!isRecord(value)) return null;
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.started_at !== "string"
  ) {
    return null;
  }

  return {
    id: value.id,
    name: value.name,
    started_at: value.started_at,
    split: typeof value.split === "string" ? value.split : null,
  };
}

function normalizeFinance(value: unknown): DashboardCardData["finance"] {
  if (!isRecord(value) || typeof value.card_count !== "number") return null;

  return {
    card_count: value.card_count,
    total_owed: typeof value.total_owed === "number" ? value.total_owed : 0,
    total_minimum:
      typeof value.total_minimum === "number" ? value.total_minimum : 0,
    overall_utilization:
      typeof value.overall_utilization === "number"
        ? value.overall_utilization
        : null,
    due_soon_count:
      typeof value.due_soon_count === "number" ? value.due_soon_count : 0,
    paid_this_month:
      typeof value.paid_this_month === "number" ? value.paid_this_month : 0,
  };
}

export function normalizeDashboardSummary(
  summary: DashboardSummary,
): DashboardSummary {
  const defaults = emptyCardData();
  const cardData: Record<string, unknown> = isRecord(summary.card_data)
    ? summary.card_data
    : {};

  return {
    ...summary,
    card_data: {
      tasks_preview: arrayOrDefault(
        cardData.tasks_preview,
        defaults.tasks_preview,
      ),
      habits_preview: arrayOrDefault(
        cardData.habits_preview,
        defaults.habits_preview,
      ),
      calendar_preview: arrayOrDefault(
        cardData.calendar_preview,
        defaults.calendar_preview,
      ),
      integrations_status: arrayOrDefault(
        cardData.integrations_status,
        defaults.integrations_status,
      ),
      gym_last_workout: normalizeGymLastWorkout(cardData.gym_last_workout),
      finance: normalizeFinance(cardData.finance),
      daily_score_detail: normalizeDailyScoreDetail(
        cardData.daily_score_detail,
      ),
    },
  };
}

async function computeHabitStreak(
  supabase: SupabaseClient,
  userId: string,
  habitId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("habit_completions")
    .select("completed_date")
    .eq("user_id", userId)
    .eq("habit_id", habitId)
    .order("completed_date", { ascending: false })
    .limit(30);

  if (error) {
    throw new Error(`habit streak query failed: ${error.message}`);
  }

  if (!data?.length) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < data.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = format(expected, "yyyy-MM-dd");

    if (data[i].completed_date === expectedStr) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

async function computeScoreStreak(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { data, error } = await supabase
    .from("daily_scores")
    .select("date, total_score")
    .eq("user_id", userId)
    .order("date", { ascending: false })
    .limit(30);

  if (error) {
    throw new Error(`score streak query failed: ${error.message}`);
  }

  if (!data?.length) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < data.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = format(expected, "yyyy-MM-dd");
    const row = data.find((d) => d.date === expectedStr);
    if (row && row.total_score > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function refreshDashboardSummary(
  userId: string,
  supabaseClient?: SupabaseClient,
): Promise<DashboardSummary> {
  const supabase = supabaseClient ?? (await createAdminClient());
  const today = format(new Date(), "yyyy-MM-dd");
  const now = new Date();

  const [
    healthRes,
    tasksRes,
    habitsRes,
    completionsRes,
    scoreRes,
    workoutsRes,
    bodyWeightRes,
    cardsRes,
    paymentsRes,
    calendarRes,
    integrationsRes,
    syncLogsRes,
  ] = await Promise.all([
    supabase
      .from("health_daily_snapshots")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .order("source", { ascending: true }),
    supabase
      .from("tasks")
      .select("*, task_categories(name, color)")
      .eq("user_id", userId)
      .neq("status", "archived")
      .or(`due_date.eq.${today},due_date.is.null`)
      .order("priority", { ascending: false })
      .limit(20),
    supabase
      .from("habits")
      .select("*")
      .eq("user_id", userId)
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("habit_completions")
      .select("habit_id")
      .eq("user_id", userId)
      .eq("completed_date", today),
    supabase
      .from("daily_scores")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .maybeSingle(),
    supabase
      .from("workouts")
      .select("id, name, started_at, completed_at, workout_type")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(50),
    supabase
      .from("body_weight_logs")
      .select("weight")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("credit_cards").select("*").eq("user_id", userId),
    supabase.from("credit_card_payments").select("*").eq("user_id", userId),
    supabase
      .from("calendar_events")
      .select("id, title, start_time, end_time, all_day, location")
      .eq("user_id", userId)
      .gte("start_time", startOfDay(now).toISOString())
      .lte("start_time", endOfDay(now).toISOString())
      .order("start_time")
      .limit(10),
    supabase.from("integrations").select("*").eq("user_id", userId),
    supabase
      .from("integration_sync_logs")
      .select("provider, duration_ms, started_at")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(20),
  ]);

  assertNoSupabaseErrors([
    ["health_daily_snapshots", healthRes],
    ["tasks", tasksRes],
    ["habits", habitsRes],
    ["habit_completions", completionsRes],
    ["daily_scores", scoreRes],
    ["workouts", workoutsRes],
    ["body_weight_logs", bodyWeightRes],
    ["credit_cards", cardsRes],
    ["credit_card_payments", paymentsRes],
    ["calendar_events", calendarRes],
    ["integrations", integrationsRes],
    ["integration_sync_logs", syncLogsRes],
  ]);

  const healthSnapshots = healthRes.data ?? [];
  const health =
    healthSnapshots.find((s) => s.source === "oura") ?? healthSnapshots[0];

  const tasks = tasksRes.data ?? [];
  const todoTasks = tasks.filter((t) => t.status === "todo");
  const completedToday = tasks.filter(
    (t) =>
      t.status === "done" &&
      t.completed_at &&
      t.completed_at.startsWith(today),
  );

  const habits = habitsRes.data ?? [];
  const completedIds = new Set(
    (completionsRes.data ?? []).map((c) => c.habit_id),
  );
  const habitScore =
    habits.length > 0
      ? Math.round((completedIds.size / habits.length) * 100)
      : null;

  const habitsPreview = await Promise.all(
    habits.map(async (habit) => ({
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      completed_today: completedIds.has(habit.id),
      streak: await computeHabitStreak(supabase, userId, habit.id),
    })),
  );

  const dailyScore = scoreRes.data ?? {
    task_points: 0,
    habit_points: 0,
    streak_bonus: 0,
    total_score: 0,
    tasks_completed: 0,
    habits_completed: 0,
  };

  const workouts = (workoutsRes.data ?? []) as Workout[];
  const completedWorkouts = workouts.filter((w) => w.completed_at);
  const lastWorkout = completedWorkouts[0] ?? null;
  const scoreStreak = await computeScoreStreak(supabase, userId);

  const cards = filterCreditCards((cardsRes.data ?? []) as CreditCard[]);
  const payments = (paymentsRes.data ?? []) as CreditCardPayment[];
  const paymentsByCard = new Map<string, CreditCardPayment[]>();
  for (const payment of payments) {
    const list = paymentsByCard.get(payment.card_id) ?? [];
    list.push(payment);
    paymentsByCard.set(payment.card_id, list);
  }

  const enrichedCards = enrichCreditCards(cards, paymentsByCard);
  const portfolio =
    enrichedCards.length > 0 ? buildPortfolioSummary(enrichedCards) : null;

  const calendarEvents = calendarRes.data ?? [];
  const integrations = integrationsRes.data ?? [];
  const syncLogs = syncLogsRes.data ?? [];

  const latestLogByProvider = new Map<
    string,
    { duration_ms: number | null; started_at: string }
  >();
  for (const log of syncLogs) {
    if (!latestLogByProvider.has(log.provider)) {
      latestLogByProvider.set(log.provider, log);
    }
  }

  const lastSync = integrations.reduce<string | null>((latest, integration) => {
    const candidate = integration.last_success_at ?? integration.last_synced_at;
    if (!candidate) return latest;
    if (!latest || candidate > latest) return candidate;
    return latest;
  }, null);

  const cardData: DashboardCardData = {
    tasks_preview: todoTasks.slice(0, 5).map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      task_categories: task.task_categories ?? null,
    })),
    habits_preview: habitsPreview,
    calendar_preview: calendarEvents.slice(0, 3).map((event) => ({
      id: event.id,
      title: event.title,
      start_time: event.start_time,
      end_time: event.end_time,
      all_day: event.all_day,
      location: event.location,
    })),
    integrations_status: integrations.map((integration) => {
      const latestLog = latestLogByProvider.get(integration.provider);
      return {
        provider: integration.provider,
        display_name:
          integration.display_name ??
          getProviderDisplayName(integration.provider),
        status: integration.status,
        last_sync_at:
          integration.last_success_at ?? integration.last_synced_at,
        last_message: integration.last_message,
        duration_ms: latestLog?.duration_ms ?? null,
      };
    }),
    gym_last_workout: lastWorkout
      ? {
          id: lastWorkout.id,
          name: lastWorkout.name,
          started_at: lastWorkout.started_at,
          split: lastWorkout.workout_type ?? null,
        }
      : null,
    finance: portfolio
      ? {
          card_count: portfolio.cardCount,
          total_owed: portfolio.totalDebt,
          total_minimum: portfolio.totalMinimumDue,
          overall_utilization: portfolio.overallUtilization,
          due_soon_count: portfolio.dueSoonCount,
          paid_this_month: portfolio.paidThisMonth,
        }
      : null,
    daily_score_detail: {
      task_points: dailyScore.task_points,
      habit_points: dailyScore.habit_points,
      streak_bonus: dailyScore.streak_bonus,
      total_score: dailyScore.total_score,
      tasks_completed: dailyScore.tasks_completed,
      habits_completed: dailyScore.habits_completed,
    },
  };

  const summaryRow = {
    user_id: userId,
    sleep_score: health?.sleep_score ?? null,
    readiness_score: health?.readiness_score ?? null,
    activity_score: health?.activity_score ?? null,
    latest_hrv: health?.hrv_ms ?? null,
    resting_hr: health?.resting_hr ?? null,
    sleep_duration_min: health?.sleep_duration_min ?? null,
    steps: health?.steps ?? null,
    tasks_due_today: todoTasks.length,
    tasks_completed_today: completedToday.length,
    habit_score: habitScore,
    daily_score: dailyScore.total_score,
    score_streak: scoreStreak,
    weekly_workouts: weeklyWorkoutCount(completedWorkouts, now),
    latest_body_weight: bodyWeightRes.data?.weight ?? null,
    gym_streak: trainingStreak(completedWorkouts),
    credit_card_balance: portfolio?.totalDebt ?? null,
    credit_utilization: portfolio?.overallUtilization ?? null,
    minimum_due: portfolio?.totalMinimumDue ?? null,
    calendar_events_today: calendarEvents.length,
    last_sync: lastSync,
    card_data: cardData,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("dashboard_summary")
    .upsert(summaryRow, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw error;
  return normalizeDashboardSummary(data as DashboardSummary);
}

export function createDefaultDashboardSummary(userId: string): DashboardSummary {
  return {
    user_id: userId,
    sleep_score: null,
    readiness_score: null,
    activity_score: null,
    latest_hrv: null,
    resting_hr: null,
    sleep_duration_min: null,
    steps: null,
    tasks_due_today: 0,
    tasks_completed_today: 0,
    habit_score: null,
    daily_score: 0,
    score_streak: 0,
    weekly_workouts: 0,
    latest_body_weight: null,
    gym_streak: 0,
    credit_card_balance: null,
    credit_utilization: null,
    minimum_due: null,
    calendar_events_today: 0,
    last_sync: null,
    card_data: emptyCardData(),
    updated_at: new Date().toISOString(),
  };
}
