import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { Card } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <main className="flex min-h-[calc(100dvh-8.5rem)] flex-col px-4 py-4">
        <section className="space-y-2">
          <h2 className="section-label">Connections</h2>
          <Card className="gap-0 overflow-hidden py-0">
            <Link
              href="/settings/integrations"
              className="block transition-colors hover:bg-muted/50 active:bg-muted/70"
            >
              <div className="flex w-full items-center justify-between gap-4 px-4 py-3.5">
                <div className="min-w-0">
                  <p className="font-medium">Integrations</p>
                  <p className="text-sm text-muted-foreground">Oura, Google</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
            </Link>
          </Card>
        </section>

        <section className="mt-auto pt-8">
          <SignOutButton />
        </section>
      </main>
    </>
  );
}
