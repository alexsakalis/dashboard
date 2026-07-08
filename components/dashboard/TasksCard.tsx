import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TaskItem } from "@/components/tasks/TaskItem";
import type { DashboardSummary, Task, TaskPriority, TaskStatus } from "@/types";

export function TasksCard({ summary }: { summary: DashboardSummary }) {
  const tasks = summary.card_data.tasks_preview;
  const totalTasks = summary.tasks_due_today;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Today&apos;s Tasks</CardTitle>
        <Link
          href="/tasks"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No tasks for today. Add one to get started.
          </p>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={
                {
                  ...task,
                  user_id: summary.user_id,
                  description: null,
                  completed_at: null,
                  points_awarded: 0,
                  recurrence_rule_id: null,
                  category_id: null,
                  created_at: "",
                  updated_at: "",
                  status: task.status as TaskStatus,
                  priority: task.priority as TaskPriority,
                } as Task
              }
              compact
            />
          ))
        )}
        {totalTasks > 5 && (
          <p className="pt-1 text-center text-xs text-muted-foreground">
            +{totalTasks - 5} more tasks
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function TaskPriorityDot({
  priority,
}: {
  priority: "low" | "medium" | "high" | "urgent";
}) {
  const priorityColors = {
    low: "bg-slate-400",
    medium: "bg-blue-500",
    high: "bg-orange-500",
    urgent: "bg-red-500",
  };

  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${priorityColors[priority]}`}
    />
  );
}
