import {
  addDays,
  addMonths,
  addWeeks,
  format,
  parseISO,
} from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecurrenceRule } from "@/types";

export function todayDateString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function calculateNextOccurrence(
  fromDate: string,
  rule: Pick<RecurrenceRule, "frequency" | "interval">,
): string {
  const interval = rule.interval || 1;
  const date = parseISO(`${fromDate}T12:00:00`);

  switch (rule.frequency) {
    case "weekly":
      return format(addWeeks(date, interval), "yyyy-MM-dd");
    case "monthly":
      return format(addMonths(date, interval), "yyyy-MM-dd");
    case "daily":
    default:
      return format(addDays(date, interval), "yyyy-MM-dd");
  }
}

export async function ensureRecurrenceTask(
  supabase: SupabaseClient,
  userId: string,
  rule: RecurrenceRule,
  dueDate: string,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", userId)
    .eq("recurrence_rule_id", rule.id)
    .eq("due_date", dueDate)
    .eq("status", "todo")
    .maybeSingle();

  if (existing) return false;

  const template = rule.template_task;

  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title: template.title,
    description: template.description ?? null,
    priority: template.priority ?? "medium",
    category_id: template.category_id ?? null,
    due_date: dueDate,
    recurrence_rule_id: rule.id,
    status: "todo",
  });

  if (error) throw error;
  return true;
}

export async function processRecurrenceRulesForUser(
  supabase: SupabaseClient,
  userId: string,
  today: string = todayDateString(),
): Promise<number> {
  const { data: rules, error } = await supabase
    .from("recurrence_rules")
    .select("*")
    .eq("user_id", userId);

  if (error) throw error;
  if (!rules?.length) return 0;

  let created = 0;

  for (const row of rules) {
    const rule = row as RecurrenceRule;

    const { data: openTodo } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", userId)
      .eq("recurrence_rule_id", rule.id)
      .eq("status", "todo")
      .limit(1)
      .maybeSingle();

    if (openTodo) continue;

    let dueDate = rule.next_occurrence ?? today;
    if (dueDate < today) {
      dueDate = today;
    }

    if (dueDate > today) continue;

    const wasCreated = await ensureRecurrenceTask(
      supabase,
      userId,
      rule,
      dueDate,
    );
    if (wasCreated) created++;

    if (rule.next_occurrence !== dueDate) {
      await supabase
        .from("recurrence_rules")
        .update({ next_occurrence: dueDate })
        .eq("id", rule.id)
        .eq("user_id", userId);
    }
  }

  return created;
}

export async function advanceRecurrenceAfterComplete(
  supabase: SupabaseClient,
  userId: string,
  task: {
    due_date: string | null;
    recurrence_rule_id: string | null;
  },
): Promise<boolean> {
  if (!task.recurrence_rule_id) return false;

  const { data: rule, error } = await supabase
    .from("recurrence_rules")
    .select("*")
    .eq("id", task.recurrence_rule_id)
    .eq("user_id", userId)
    .single();

  if (error || !rule) return false;

  const recurrenceRule = rule as RecurrenceRule;
  const completedDue = task.due_date ?? todayDateString();
  const nextOccurrence = calculateNextOccurrence(completedDue, recurrenceRule);

  await supabase
    .from("recurrence_rules")
    .update({ next_occurrence: nextOccurrence })
    .eq("id", recurrenceRule.id)
    .eq("user_id", userId);

  await ensureRecurrenceTask(
    supabase,
    userId,
    recurrenceRule,
    nextOccurrence,
  );

  return true;
}

export async function processAllRecurrenceRules(
  supabase: SupabaseClient,
): Promise<{ users: number; created: number }> {
  const { data: rules, error } = await supabase
    .from("recurrence_rules")
    .select("user_id");

  if (error) throw error;

  const userIds = [...new Set((rules ?? []).map((row) => row.user_id))];
  let created = 0;

  for (const userId of userIds) {
    created += await processRecurrenceRulesForUser(supabase, userId);
  }

  return { users: userIds.length, created };
}
