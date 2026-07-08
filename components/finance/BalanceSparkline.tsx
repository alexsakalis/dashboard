import type { BalanceChartPoint } from "@/types/finance";
import { formatPercent } from "@/lib/finance/format";

interface BalanceSparklineProps {
  points: BalanceChartPoint[];
  title: string;
  variant?: "balance" | "utilization";
  height?: number;
}

export function BalanceSparkline({
  points,
  title,
  variant = "balance",
  height = 48,
}: BalanceSparklineProps) {
  if (points.length < 2) {
    return (
      <div className="rounded-xl bg-muted/35 px-3 py-3 ring-1 ring-border/40">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Not enough history yet.
        </p>
      </div>
    );
  }

  const values =
    variant === "utilization"
      ? points.map((p) => (p.utilization ?? 0) * 100)
      : points.map((p) => p.balance);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 280;
  const padding = 4;

  const coords = values.map((v, i) => {
    const x = padding + (i / (values.length - 1)) * (width - padding * 2);
    const y =
      height - padding - ((v - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const last = points[points.length - 1];
  const lastValue =
    variant === "utilization"
      ? formatPercent(last.utilization)
      : `$${Math.round(last.balance).toLocaleString()}`;

  return (
    <div className="rounded-xl bg-muted/35 px-3 py-3 ring-1 ring-border/40">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <p className="text-sm font-semibold tabular-nums">{lastValue}</p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-2 w-full"
        aria-hidden
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
          points={coords.join(" ")}
        />
      </svg>
    </div>
  );
}
