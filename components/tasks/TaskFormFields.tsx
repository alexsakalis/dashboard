"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import type { TaskCategory, TaskPriority } from "@/types";

export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  dueDate: string;
  categoryId: string;
  isRecurring: boolean;
  frequency: string;
}

interface TaskFormFieldsProps {
  values: TaskFormValues;
  onChange: (updates: Partial<TaskFormValues>) => void;
  categories: TaskCategory[];
  showRecurring?: boolean;
  idPrefix?: string;
}

export function TaskFormFields({
  values,
  onChange,
  categories,
  showRecurring = true,
  idPrefix = "task",
}: TaskFormFieldsProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-title`}>Title</Label>
        <Input
          id={`${idPrefix}-title`}
          name="title"
          required
          placeholder="What needs doing?"
          value={values.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          name="description"
          placeholder="Optional details"
          rows={2}
          value={values.description}
          onChange={(event) => onChange({ description: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Priority</Label>
          <Select
            value={values.priority}
            onValueChange={(value) =>
              onChange({ priority: (value ?? "medium") as TaskPriority })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${idPrefix}-due-date`}>Due date</Label>
          <Input
            id={`${idPrefix}-due-date`}
            name="due_date"
            type="date"
            value={values.dueDate}
            onChange={(event) => onChange({ dueDate: event.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={values.categoryId || "none"}
          onValueChange={(value) =>
            onChange({ categoryId: value === "none" ? "" : (value ?? "") })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="No category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No category</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showRecurring && (
        <>
          <div className="flex items-center justify-between">
            <Label htmlFor={`${idPrefix}-recurring`}>Recurring</Label>
            <Switch
              id={`${idPrefix}-recurring`}
              checked={values.isRecurring}
              onCheckedChange={(checked) => onChange({ isRecurring: checked })}
            />
          </div>
          {values.isRecurring && (
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={values.frequency}
                onValueChange={(value) =>
                  onChange({ frequency: value ?? "daily" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function createDefaultTaskFormValues(
  overrides?: Partial<TaskFormValues>,
): TaskFormValues {
  return {
    title: "",
    description: "",
    priority: "medium",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    categoryId: "",
    isRecurring: false,
    frequency: "daily",
    ...overrides,
  };
}

export function taskToFormValues(
  task: {
    title: string;
    description?: string | null;
    priority: TaskPriority;
    due_date?: string | null;
    category_id?: string | null;
    recurrence_rule_id?: string | null;
  },
): TaskFormValues {
  return {
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    dueDate: task.due_date ?? format(new Date(), "yyyy-MM-dd"),
    categoryId: task.category_id ?? "",
    isRecurring: false,
    frequency: "daily",
  };
}
