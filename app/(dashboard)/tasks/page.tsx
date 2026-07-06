import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getTasks } from "@/lib/actions/tasks";
import { TaskItem } from "@/components/tasks/TaskItem";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

async function TaskList({ filter }: { filter: "today" | "upcoming" | "recurring" | "all" }) {
  const tasks = await getTasks(filter);

  if (tasks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No tasks here yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} />
      ))}
    </div>
  );
}

export default function TasksPage() {
  return (
    <>
      <PageHeader
        title="Tasks"
        action={<CreateTaskDialog />}
      />
      <main className="px-4 py-4">
        <Tabs defaultValue="today">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="today" className="flex-1">Today</TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
            <TabsTrigger value="recurring" className="flex-1">Recurring</TabsTrigger>
            <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
          </TabsList>
          <TabsContent value="today">
            <Suspense fallback={<CardSkeleton />}>
              <TaskList filter="today" />
            </Suspense>
          </TabsContent>
          <TabsContent value="upcoming">
            <Suspense fallback={<CardSkeleton />}>
              <TaskList filter="upcoming" />
            </Suspense>
          </TabsContent>
          <TabsContent value="recurring">
            <Suspense fallback={<CardSkeleton />}>
              <TaskList filter="recurring" />
            </Suspense>
          </TabsContent>
          <TabsContent value="all">
            <Suspense fallback={<CardSkeleton />}>
              <TaskList filter="all" />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
