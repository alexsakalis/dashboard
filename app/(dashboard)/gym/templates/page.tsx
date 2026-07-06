import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getWorkoutTemplates } from "@/lib/actions/gym";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

async function TemplatesList() {
  const templates = await getWorkoutTemplates();

  if (templates.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No templates yet. Complete a workout and save it as a template later.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <Card key={template.id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{template.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {template.muscle_groups.join(", ")}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {(template.exercises as Array<{ name: string }>).length} exercises
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function GymTemplatesPage() {
  return (
    <>
      <PageHeader title="Workout Templates" />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <TemplatesList />
        </Suspense>
      </main>
    </>
  );
}
