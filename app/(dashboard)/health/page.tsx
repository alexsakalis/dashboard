import { format } from "date-fns";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getHealthSnapshots } from "@/lib/actions/dashboard";
import {
  buildHealthMetricsSeries,
  buildRecoveryHint,
  buildSleepReadinessInsight,
  formatTrendDelta,
  summarizeHealthTrends,
} from "@/lib/health/trends";
import { mergeHealthMetrics } from "@/lib/integrations/health-metrics";
import { RecoveryBanner } from "@/components/health/RecoveryBanner";
import { HealthTrendGrid } from "@/components/health/HealthTrendGrid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

async function HealthDetails() {
  const snapshots = await getHealthSnapshots(30);
  const today = format(new Date(), "yyyy-MM-dd");
  const todayMetrics = mergeHealthMetrics(snapshots, today);
  const trend7d = summarizeHealthTrends(snapshots, 7);
  const trend30d = summarizeHealthTrends(snapshots, 30);
  const series7d = buildHealthMetricsSeries(snapshots, 7);
  const correlation = buildSleepReadinessInsight(series7d);

  const hint = buildRecoveryHint(
    todayMetrics.readiness_score ?? null,
    todayMetrics.sleep_score ?? null,
    trend7d.averages.readiness_score,
  );

  if (snapshots.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No health data yet. Connect Oura in Settings.
      </p>
    );
  }

  const recentDates = [...new Set(snapshots.map((s) => s.date))]
    .sort()
    .reverse()
    .slice(0, 7);

  return (
    <div className="space-y-6">
      <RecoveryBanner hint={hint} />

      {correlation && (
        <p className="rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5 text-sm text-muted-foreground">
          {correlation}
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">7-day trends</h2>
        <HealthTrendGrid snapshots={snapshots} days={7} />
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          {formatTrendDelta(trend7d.deltas.sleep_score, "Sleep") && (
            <span>{formatTrendDelta(trend7d.deltas.sleep_score, "Sleep")}</span>
          )}
          {formatTrendDelta(trend7d.deltas.readiness_score, "Readiness") && (
            <span>
              {formatTrendDelta(trend7d.deltas.readiness_score, "Readiness")}
            </span>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">30-day overview</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Avg sleep" value={trend30d.averages.sleep_score} />
          <Stat label="Avg readiness" value={trend30d.averages.readiness_score} />
          <Stat
            label="Avg HRV"
            value={
              trend30d.averages.hrv_ms != null
                ? Math.round(trend30d.averages.hrv_ms)
                : null
            }
            unit="ms"
          />
          <Stat label="Avg steps" value={trend30d.averages.steps} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Recent days</h2>
        {recentDates.map((date) => {
          const metrics = mergeHealthMetrics(snapshots, date);
          return (
            <Card key={date}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {format(new Date(`${date}T12:00:00`), "EEEE, MMM d")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <Stat label="Sleep Score" value={metrics.sleep_score} />
                  <Stat label="Readiness" value={metrics.readiness_score} />
                  <Stat
                    label="HRV"
                    value={
                      metrics.hrv_ms != null ? Math.round(metrics.hrv_ms) : null
                    }
                    unit="ms"
                  />
                  <Stat label="Resting HR" value={metrics.resting_hr} unit="bpm" />
                  <Stat label="Steps" value={metrics.steps} />
                  <Stat label="Activity" value={metrics.activity_score} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/35 p-3 ring-1 ring-border/40">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium tabular-nums">
        {value !== null ? value : "—"}
        {value !== null && unit ? ` ${unit}` : ""}
      </p>
    </div>
  );
}

export default function HealthPage() {
  return (
    <>
      <PageHeader title="Health" subtitle="Oura Ring trends & recovery" />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <HealthDetails />
        </Suspense>
      </main>
    </>
  );
}
