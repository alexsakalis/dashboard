import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getTasks } from "@/lib/actions/tasks";
import { TaskItem } from "@/components/tasks/TaskItem";

const priorityColors = {
  low: "bg-slate-400",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

export async function TasksCard() {
  const tasks = await getTasks("today");
  const displayTasks = tasks.slice(0, 5);

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
        {displayTasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No tasks for today. Add one to get started.
          </p>
        ) : (
          displayTasks.map((task) => (
            <TaskItem key={task.id} task={task} compact />
          ))
        )}
        {tasks.length > 5 && (
          <p className="pt-1 text-center text-xs text-muted-foreground">
            +{tasks.length - 5} more tasks
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function TaskPriorityDot({
  priority,
}: {
  priority: keyof typeof priorityColors;
}) {
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full ${priorityColors[priority]}`}
    />
  );
}

export function TaskDueBadge({ dueDate }: { dueDate: string | null }) {
  if (!dueDate) return null;
  const isToday = dueDate === format(new Date(), "yyyy-MM-dd");
  return (
    <Badge variant="secondary" className="text-xs font-normal">
      {isToday ? "Today" : format(new Date(dueDate), "MMM d")}
    </Badge>
  );
}
