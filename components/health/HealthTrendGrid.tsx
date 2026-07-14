import { SparklineChart } from "@/components/gym/charts/SparklineChart";
import {
  buildHealthMetricsSeries,
  summarizeHealthTrends,
  toHealthSparklinePoints,
  type HealthMetricKey,
} from "@/lib/health/trends";
import type { HealthDailySnapshot } from "@/types";

const TREND_METRICS: Array<{
  key: HealthMetricKey;
  title: string;
  formatValue?: (value: number) => string;
}> = [
  { key: "sleep_score", title: "Sleep score" },
  { key: "readiness_score", title: "Readiness" },
  {
    key: "hrv_ms",
    title: "HRV",
    formatValue: (value) => `${Math.round(value)} ms`,
  },
  {
    key: "steps",
    title: "Steps",
    formatValue: (value) => value.toLocaleString(),
  },
];

function AverageStat({
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
      <p className="mt-1 text-lg font-semibold tabular-nums">
        {value != null ? value : "—"}
        {value != null && unit ? (
          <span className="text-xs font-normal text-muted-foreground">
            {" "}
            {unit}
          </span>
        ) : null}
      </p>
    </div>
  );
}

export function HealthTrendGrid({
  snapshots,
  days,
}: {
  snapshots: HealthDailySnapshot[];
  days: number;
}) {
  const series = buildHealthMetricsSeries(snapshots, days);
  const summary = summarizeHealthTrends(snapshots, days);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <AverageStat
          label={`${days}d avg sleep`}
          value={summary.averages.sleep_score}
        />
        <AverageStat
          label={`${days}d avg readiness`}
          value={summary.averages.readiness_score}
        />
        <AverageStat
          label={`${days}d avg HRV`}
          value={
            summary.averages.hrv_ms != null
              ? Math.round(summary.averages.hrv_ms)
              : null
          }
          unit="ms"
        />
        <AverageStat
          label={`${days}d avg steps`}
          value={summary.averages.steps}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {TREND_METRICS.map(({ key, title, formatValue }) => (
          <SparklineChart
            key={key}
            title={title}
            points={toHealthSparklinePoints(series, key)}
            formatValue={formatValue}
          />
        ))}
      </div>
    </div>
  );
}
