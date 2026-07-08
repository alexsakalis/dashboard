import { Suspense } from "react";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { getBodyWeightLogs } from "@/lib/actions/gym";
import { BodyWeightForm } from "@/components/gym/BodyWeightForm";
import { BodyWeightChart } from "@/components/gym/ExerciseProgressChart";
import { Card, CardContent } from "@/components/ui/card";

async function BodyWeightContent() {
  const logs = await getBodyWeightLogs(60);
  const chartPoints = [...logs]
    .reverse()
    .map((log) => ({
      date: log.logged_date,
      value: log.weight,
    }));

  return (
    <div className="space-y-4">
      <BodyWeightForm />
      <BodyWeightChart points={chartPoints} />

      {logs.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No body weight entries yet.
        </p>
      ) : (
        <div className="space-y-2">
          <h2 className="section-label">History</h2>
          {logs.map((log) => (
            <Card key={log.id}>
              <CardContent className="flex items-center justify-between p-3">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(log.logged_date + "T12:00:00"), "MMM d, yyyy")}
                </span>
                <span className="font-semibold tabular-nums">
                  {log.weight} {log.unit}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BodyWeightPage() {
  return (
    <>
      <PageHeader title="Body Weight" subtitle="Track weight over time" />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <BodyWeightContent />
        </Suspense>
      </main>
    </>
  );
}
