import Link from "next/link";
import { Suspense } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { getWorkoutTemplates } from "@/lib/actions/gym";
import { TemplateListItem } from "@/components/gym/TemplateListItem";

async function TemplatesList() {
  const templates = await getWorkoutTemplates();

  if (templates.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No templates yet. Create one to speed up your workouts.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => (
        <TemplateListItem key={template.id} template={template} />
      ))}
    </div>
  );
}

export default function GymTemplatesPage() {
  return (
    <>
      <PageHeader
        title="Templates"
        subtitle="Pre-built workout structures"
        action={
          <Link
            href="/gym/templates/new"
            className="inline-flex h-7 items-center gap-1 rounded-[min(var(--radius-md),12px)] bg-primary px-2.5 text-[0.8rem] font-medium text-primary-foreground shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            New
          </Link>
        }
      />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <TemplatesList />
        </Suspense>
      </main>
    </>
  );
}
