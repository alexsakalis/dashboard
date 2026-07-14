import { PageHeader } from "@/components/layout/PageHeader";
import { PlateCalculator } from "@/components/gym/PlateCalculator";
import { getGymPreferences } from "@/lib/actions/gym";
import { Card, CardContent } from "@/components/ui/card";

export default async function GymPlatesPage() {
  const preferences = await getGymPreferences();
  const unit = preferences?.default_weight_unit === "kg" ? "kg" : "lbs";

  return (
    <>
      <PageHeader
        title="Plate calculator"
        subtitle="Load the bar to your target weight"
      />
      <main className="px-4 py-4">
        <Card>
          <CardContent className="p-4">
            <PlateCalculator defaultUnit={unit} />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
