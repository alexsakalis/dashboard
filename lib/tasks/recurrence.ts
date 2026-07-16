import {
  addDays,
  addMonths,
  addWeeks,
  format,
  parseISO,
} from "date-fns";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RecurrenceRule, TaskPriority } from "@/types";

const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];

type NormalizedTemplateTask = {
  title: string;
  description: string | null;
  priority: TaskPriority;
  category_id: string | null;
};

function normalizeTemplateTask(
  template: RecurrenceRule["template_task"] | null | undefined,
): NormalizedTemplateTask | null {
  if (!template || typeof template.title !== "string" || !template.title.trim()) {
    return null;
  }

  const priority = TASK_PRIORITIES.includes(template.priority)
    ? template.priority
    : "medium";
  const categoryId =
    typeof template.category_id === "string" && template.category_id.trim()
      ? template.category_id
      : null;

  return {
    title: template.title.trim(),
    description:
      typeof template.description === "string" && template.description.trim()
        ? template.description.trim()
        : null,
    priority,
    category_id: categoryId,
  };
}

async function resolveTemplateCategoryId(
  supabase: SupabaseClient,
  userId: string,
  categoryId: string | null,
): Promise<string | null> {
  if (!categoryId) return null;

  const { data, error } = await supabase
    .from("task_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

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
  const { data: existing, error: existingError } = await supabase
    .from("tasks")
    .select("id")
    .eq("user_id", userId)
    .eq("recurrence_rule_id", rule.id)
    .eq("due_date", dueDate)
    .eq("status", "todo")
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return false;

  const template = normalizeTemplateTask(rule.template_task);
  if (!template) return false;
  const categoryId = await resolveTemplateCategoryId(
    supabase,
    userId,
    template.category_id,
  );

  const { error } = await supabase.from("tasks").insert({
    user_id: userId,
    title: template.title,
    description: template.description ?? null,
    priority: template.priority ?? "medium",
    category_id: categoryId,
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

    try {
      const { data: openTodo, error: openTodoError } = await supabase
        .from("tasks")
        .select("id")
        .eq("user_id", userId)
        .eq("recurrence_rule_id", rule.id)
        .eq("status", "todo")
        .limit(1)
        .maybeSingle();

      if (openTodoError) throw openTodoError;
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
        const { error: updateError } = await supabase
          .from("recurrence_rules")
          .update({ next_occurrence: dueDate })
          .eq("id", rule.id)
          .eq("user_id", userId);
        if (updateError) throw updateError;
      }
    } catch (error) {
      console.error("Skipping recurrence rule after processing error", {
        ruleId: rule.id,
        userId,
        error,
      });
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
