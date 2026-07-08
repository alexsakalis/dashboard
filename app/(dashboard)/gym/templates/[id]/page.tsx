import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { getTemplate } from "@/lib/actions/gym";
import { TemplateForm } from "@/components/gym/TemplateForm";

export default async function EditTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = await getTemplate(id);
  if (!template || template.is_system) notFound();

  const exercises =
    template.workout_template_exercises ?? template.exercises ?? [];

  return (
    <>
      <PageHeader title="Edit Template" />
      <main className="px-4 py-4">
        <TemplateForm
          templateId={id}
          initial={{
            name: template.name,
            split: template.split,
            exercises: exercises.map((ex) => ({
              exercise_name: ex.exercise_name ?? (ex as { name?: string }).name ?? "",
              muscle_group: ex.muscle_group,
              default_sets: ex.default_sets,
              default_reps: ex.default_reps,
              notes: ex.notes,
            })),
          }}
        />
      </main>
    </>
  );
}
