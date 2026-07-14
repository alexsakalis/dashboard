import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getTaskCategories, getTasks, processRecurringTasksForCurrentUser } from "@/lib/actions/tasks";
import { TaskItem } from "@/components/tasks/TaskItem";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { CreateCategoryDialog } from "@/components/tasks/CreateCategoryDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import type { TaskCategory } from "@/types";

async function TaskList({
  filter,
  categories,
}: {
  filter: "today" | "upcoming" | "recurring" | "all";
  categories: TaskCategory[];
}) {
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
        <TaskItem key={task.id} task={task} categories={categories} />
      ))}
    </div>
  );
}

async function TasksPageContent() {
  await processRecurringTasksForCurrentUser();
  const categories = await getTaskCategories();

  return (
    <>
      <PageHeader
        title="Tasks"
        action={
          <div className="flex items-center gap-1">
            <CreateCategoryDialog />
            <CreateTaskDialog categories={categories} />
          </div>
        }
      />
      <main className="px-4 py-4">
        <Tabs defaultValue="today">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="today" className="flex-1">
              Today
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="flex-1">
              Upcoming
            </TabsTrigger>
            <TabsTrigger value="recurring" className="flex-1">
              Recurring
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1">
              All
            </TabsTrigger>
          </TabsList>
          <TabsContent value="today">
            <Suspense fallback={<CardSkeleton />}>
              <TaskList filter="today" categories={categories} />
            </Suspense>
          </TabsContent>
          <TabsContent value="upcoming">
            <Suspense fallback={<CardSkeleton />}>
              <TaskList filter="upcoming" categories={categories} />
            </Suspense>
          </TabsContent>
          <TabsContent value="recurring">
            <Suspense fallback={<CardSkeleton />}>
              <TaskList filter="recurring" categories={categories} />
            </Suspense>
          </TabsContent>
          <TabsContent value="all">
            <Suspense fallback={<CardSkeleton />}>
              <TaskList filter="all" categories={categories} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<CardSkeleton />}>
      <TasksPageContent />
    </Suspense>
  );
}
