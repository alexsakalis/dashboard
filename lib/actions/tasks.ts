"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { refreshDashboardSummaryForCurrentUser } from "@/lib/actions/dashboard";
import { createClient } from "@/lib/supabase/server";
import { awardTaskPoints } from "@/lib/scoring/actions";
import {
  advanceRecurrenceAfterComplete,
  processRecurrenceRulesForUser,
} from "@/lib/tasks/recurrence";
import type { RecurrenceFrequency, TaskPriority, TaskStatus } from "@/types";

const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
const RECURRENCE_FREQUENCIES: RecurrenceFrequency[] = [
  "daily",
  "weekly",
  "monthly",
];

function parsePriority(value: FormDataEntryValue | null): TaskPriority {
  if (!value) return "medium";
  if (typeof value !== "string" || !TASK_PRIORITIES.includes(value as TaskPriority)) {
    throw new Error("Invalid task priority");
  }
  return value as TaskPriority;
}

function parseFrequency(value: FormDataEntryValue | null): RecurrenceFrequency {
  if (!value) return "daily";
  if (
    typeof value !== "string" ||
    !RECURRENCE_FREQUENCIES.includes(value as RecurrenceFrequency)
  ) {
    throw new Error("Invalid recurrence frequency");
  }
  return value as RecurrenceFrequency;
}

function getOptionalString(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function requireOwnedCategoryId(
  supabase: Awaited<ReturnType<typeof createClient>>,
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
  if (!data) throw new Error("Invalid task category");
  return data.id;
}

export async function getTasks(filter?: "today" | "upcoming" | "recurring" | "all") {
  const user = await requireUser();
  const supabase = await createClient();
  const today = format(new Date(), "yyyy-MM-dd");

  let query = supabase
    .from("tasks")
    .select("*, task_categories(*)")
    .eq("user_id", user.id)
    .neq("status", "archived")
    .order("due_date", { ascending: true, nullsFirst: false })
    .order("priority", { ascending: false });

  if (filter === "today") {
    query = query.or(`due_date.eq.${today},due_date.is.null`).eq("status", "todo");
  } else if (filter === "upcoming") {
    query = query.gt("due_date", today).eq("status", "todo");
  } else if (filter === "recurring") {
    query = query.not("recurrence_rule_id", "is", null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getTaskCategories() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("task_categories")
    .select("*")
    .eq("user_id", user.id)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function createTask(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const title = getOptionalString(formData.get("title"));
  if (!title) throw new Error("Task title is required");
  const description = getOptionalString(formData.get("description"));
  const priority = parsePriority(formData.get("priority"));
  const dueDate = getOptionalString(formData.get("due_date"));
  const categoryId = await requireOwnedCategoryId(
    supabase,
    user.id,
    getOptionalString(formData.get("category_id")),
  );
  const isRecurring = formData.get("is_recurring") === "true";
  const frequency = parseFrequency(formData.get("frequency"));

  let recurrenceRuleId: string | null = null;

  if (isRecurring) {
    const { data: rule, error: ruleError } = await supabase
      .from("recurrence_rules")
      .insert({
        user_id: user.id,
        frequency,
        template_task: { title, priority, category_id: categoryId, description },
        next_occurrence: dueDate ?? today(),
      })
      .select()
      .single();

    if (ruleError) throw ruleError;
    recurrenceRuleId = rule.id;
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title,
    description,
    priority,
    due_date: dueDate,
    category_id: categoryId || null,
    recurrence_rule_id: recurrenceRuleId,
  });

  if (error) {
    if (recurrenceRuleId) {
      await supabase
        .from("recurrence_rules")
        .delete()
        .eq("id", recurrenceRuleId)
        .eq("user_id", user.id);
    }
    throw error;
  }
  revalidatePath("/");
  revalidatePath("/tasks");
  await refreshDashboardSummaryForCurrentUser();
}

export async function updateTask(
  taskId: string,
  updates: {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    due_date?: string | null;
    category_id?: string | null;
    status?: TaskStatus;
  },
) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .update(updates)
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/tasks");
  await refreshDashboardSummaryForCurrentUser();
}

export async function completeTask(taskId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !task) throw fetchError ?? new Error("Task not found");

  const { error } = await supabase
    .from("tasks")
    .update({
      status: "done",
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId);

  if (error) throw error;

  await awardTaskPoints(
    user.id,
    taskId,
    task.priority,
    !!task.recurrence_rule_id,
  );

  await advanceRecurrenceAfterComplete(supabase, user.id, task);

  revalidatePath("/");
  revalidatePath("/tasks");
  await refreshDashboardSummaryForCurrentUser();
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/");
  revalidatePath("/tasks");
  await refreshDashboardSummaryForCurrentUser();
}

export async function createCategory(name: string, color: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase.from("task_categories").insert({
    user_id: user.id,
    name,
    color,
  });

  if (error) throw error;
  revalidatePath("/tasks");
}

function today() {
  return format(new Date(), "yyyy-MM-dd");
}

export async function processRecurringTasksForCurrentUser(): Promise<number> {
  const user = await requireUser();
  const supabase = await createClient();
  return processRecurrenceRulesForUser(supabase, user.id);
}
