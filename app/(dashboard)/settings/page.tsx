import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { SignOutButton } from "@/components/settings/SignOutButton";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />
      <main className="space-y-4 px-4 py-4">
        <Link href="/settings/integrations">
          <Card className="transition-colors hover:bg-muted/50">
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">Integrations</p>
                <p className="text-sm text-muted-foreground">
                  Oura, Google, Apple Health
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <SignOutButton />
      </main>
    </>
  );
}
