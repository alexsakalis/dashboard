import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Activity, Heart, Moon, Footprints } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getHealthSnapshots } from "@/lib/actions/dashboard";
import { mergeHealthMetrics } from "@/lib/integrations/health-ingest/parser";

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
    <div className="flex flex-col items-center gap-1 rounded-lg bg-muted/50 p-3">
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

export async function HealthCard() {
  const snapshots = await getHealthSnapshots();
  const today = format(new Date(), "yyyy-MM-dd");
  const metrics = mergeHealthMetrics(snapshots, today);

  const hasData = Object.values(metrics).some(
    (v, i) => i > 0 && v !== null,
  );

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
            Connect Oura or Apple Health in Settings.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <MetricItem icon={Moon} label="Sleep" value={metrics.sleep_score} />
            <MetricItem
              icon={Activity}
              label="Readiness"
              value={metrics.readiness_score}
            />
            <MetricItem icon={Heart} label="HRV" value={metrics.hrv_ms ? Math.round(metrics.hrv_ms) : null} unit="ms" />
            <MetricItem icon={Footprints} label="Steps" value={metrics.steps} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
