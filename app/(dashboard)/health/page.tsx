import { format } from "date-fns";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getHealthSnapshots } from "@/lib/actions/dashboard";
import { mergeHealthMetrics } from "@/lib/integrations/health-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

async function HealthDetails() {
  const snapshots = await getHealthSnapshots(14);
  const dates = [...new Set(snapshots.map((s) => s.date))].slice(0, 7);

  if (dates.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No health data yet. Connect Oura in Settings.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {dates.map((date) => {
        const metrics = mergeHealthMetrics(snapshots, date);
        return (
          <Card key={date}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {format(new Date(date), "EEEE, MMM d")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Metric label="Sleep Score" value={metrics.sleep_score} />
                <Metric label="Readiness" value={metrics.readiness_score} />
                <Metric
                  label="HRV"
                  value={metrics.hrv_ms ? Math.round(metrics.hrv_ms) : null}
                  unit="ms"
                />
                <Metric label="Resting HR" value={metrics.resting_hr} unit="bpm" />
                <Metric label="Steps" value={metrics.steps} />
                <Metric label="Calories" value={metrics.active_calories} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit?: string;
}) {
  return (
    <div>
      <p className="text-muted-foreground">{label}</p>
      <p className="font-medium tabular-nums">
        {value !== null ? value : "—"}
        {value !== null && unit ? ` ${unit}` : ""}
      </p>
    </div>
  );
}

export default function HealthPage() {
  return (
    <>
      <PageHeader title="Health" subtitle="Oura Ring" />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <HealthDetails />
        </Suspense>
      </main>
    </>
  );
}
