import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { TemplateForm } from "@/components/gym/TemplateForm";

export default function NewTemplatePage() {
  return (
    <>
      <PageHeader title="New Template" />
      <main className="px-4 py-4">
        <TemplateForm />
      </main>
    </>
  );
}
