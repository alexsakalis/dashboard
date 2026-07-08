import Link from "next/link";
import { ArrowRight, Activity, Heart, Moon, Footprints } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary } from "@/types";

function MetricItem({
  icon: Icon,
  label,
  value,
  unit,
}: {
  icon: React.ElementType;
  label: string;
  value: number | null;
  unit?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-xl bg-muted/35 p-3 ring-1 ring-border/40">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <p className="text-lg font-semibold tabular-nums">
        {value !== null ? value : "—"}
        {value !== null && unit && (
          <span className="text-xs font-normal text-muted-foreground">
            {unit}
          </span>
        )}
      </p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function HealthCard({ summary }: { summary: DashboardSummary }) {
  const hasData =
    summary.sleep_score != null ||
    summary.readiness_score != null ||
    summary.latest_hrv != null ||
    summary.steps != null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Health</CardTitle>
        <Link
          href="/health"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Details <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Connect Oura in Settings to see health metrics.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <MetricItem
              icon={Moon}
              label="Sleep"
              value={summary.sleep_score}
            />
            <MetricItem
              icon={Activity}
              label="Readiness"
              value={summary.readiness_score}
            />
            <MetricItem
              icon={Heart}
              label="HRV"
              value={
                summary.latest_hrv != null
                  ? Math.round(Number(summary.latest_hrv))
                  : null
              }
              unit="ms"
            />
            <MetricItem
              icon={Footprints}
              label="Steps"
              value={summary.steps}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
