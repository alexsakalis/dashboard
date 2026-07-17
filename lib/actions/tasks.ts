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
import type { TaskPriority, TaskStatus } from "@/types";

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

  const title = formData.get("title") as string;
  const description = (formData.get("description") as string) || null;
  const priority = (formData.get("priority") as TaskPriority) || "medium";
  const dueDate = (formData.get("due_date") as string) || null;
  const categoryId = (formData.get("category_id") as string) || null;
  const isRecurring = formData.get("is_recurring") === "true";
  const frequency = (formData.get("frequency") as string) || "daily";

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

  if (error) throw error;
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

  await advanceRecurrenceAfterComplete(supabase, user.id, task);

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

  revalidatePath("/");
  revalidatePath("/tasks");
  await refreshDashboardSummaryForCurrentUser();
}

export async function deleteTask(taskId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: task, error: fetchError } = await supabase
    .from("tasks")
    .select("recurrence_rule_id")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !task) throw fetchError ?? new Error("Task not found");

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (error) throw error;

  if (task.recurrence_rule_id) {
    const { error: ruleError } = await supabase
      .from("recurrence_rules")
      .delete()
      .eq("id", task.recurrence_rule_id)
      .eq("user_id", user.id);
    if (ruleError) throw ruleError;
  }

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
