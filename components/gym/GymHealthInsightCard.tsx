import { cn } from "@/lib/utils";
import { Activity, Heart, TrendingDown, TrendingUp } from "lucide-react";
import type { GymHealthInsight } from "@/lib/gym/health-crossover";

const levelStyles = {
  optimal: "border-emerald-500/30 bg-emerald-500/10",
  good: "border-primary/20 bg-primary/5",
  caution: "border-amber-500/30 bg-amber-500/10",
  recovery: "border-rose-500/30 bg-rose-500/10",
  unavailable: "border-border/50 bg-muted/35",
} as const;

const intensityLabels = {
  heavy: "Heavy day",
  moderate: "Normal volume",
  light: "Light session",
  rest: "Recovery / rest",
} as const;

export function GymHealthInsightCard({
  insight,
  compact = false,
}: {
  insight: GymHealthInsight;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3 py-3",
        levelStyles[insight.level],
        compact && "py-2.5",
      )}
    >
      <div className="flex items-start gap-2.5">
        <Activity
          className={cn(
            "mt-0.5 h-4 w-4 shrink-0",
            insight.level === "optimal" && "text-emerald-600 dark:text-emerald-400",
            insight.level === "good" && "text-primary",
            insight.level === "caution" && "text-amber-600 dark:text-amber-400",
            insight.level === "recovery" && "text-rose-600 dark:text-rose-400",
            insight.level === "unavailable" && "text-muted-foreground",
          )}
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium leading-snug">{insight.headline}</p>
          {!compact && (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {insight.detail}
            </p>
          )}
          {!compact && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span className="rounded-full bg-background/60 px-2 py-0.5 ring-1 ring-border/50">
                {intensityLabels[insight.intensity]}
              </span>
              {insight.readiness != null && (
                <span className="inline-flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  Readiness {insight.readiness}
                </span>
              )}
              {insight.hrvChangePct != null && (
                <span className="inline-flex items-center gap-1">
                  {insight.hrvChangePct >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  HRV {insight.hrvChangePct > 0 ? "+" : ""}
                  {insight.hrvChangePct}%
                </span>
              )}
              {insight.readiness == null && insight.hrvChangePct == null && (
                <span className="inline-flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  Oura recovery data
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
