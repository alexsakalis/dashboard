import { PageHeader } from "@/components/layout/PageHeader";
import { GymSettingsForm } from "@/components/gym/GymSettingsForm";
import { getGymPreferences } from "@/lib/actions/gym";
import { Card, CardContent } from "@/components/ui/card";

export default async function GymSettingsPage() {
  const preferences = await getGymPreferences();

  return (
    <>
      <PageHeader title="Gym settings" subtitle="Units, rest timer, split rotation" />
      <main className="px-4 py-4">
        <Card>
          <CardContent className="p-4">
            <GymSettingsForm preferences={preferences} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
