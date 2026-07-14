import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { buildSmartScoreBreakdown } from "@/lib/scoring/smart-score";
import { DAILY_SCORE_GOAL } from "@/lib/scoring/daily-score";
import type { DashboardSummary } from "@/types";

export function DailyScoreCard({ summary }: { summary: DashboardSummary }) {
  const breakdown = buildSmartScoreBreakdown(summary);
  const score = summary.card_data.daily_score_detail;

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Daily Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-bold tabular-nums tracking-tight">
              {breakdown.enhancedTotal}
            </p>
            <p className="text-sm text-muted-foreground">
              / {DAILY_SCORE_GOAL} goal
              {breakdown.wellnessBonus !== 0 && (
                <span className="ml-1 text-xs">
                  ({breakdown.baseScore} base
                  {breakdown.wellnessBonus > 0 ? " +" : " "}
                  {breakdown.wellnessBonus} wellness)
                </span>
              )}
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{score.tasks_completed} tasks</p>
            <p>{score.habits_completed} habits</p>
          </div>
        </div>
        <Progress value={breakdown.progress} className="h-2" />
        <p className="text-xs text-muted-foreground">
          {breakdown.progress}% of daily goal
        </p>

        <div className="space-y-1.5 rounded-xl bg-background/50 p-3 ring-1 ring-border/40">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Breakdown
          </p>
          {breakdown.components.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <div className="min-w-0">
                <p className="font-medium">{item.label}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <p
                className={`shrink-0 tabular-nums font-semibold ${
                  item.points < 0 ? "text-rose-500" : "text-primary"
                }`}
              >
                {item.points > 0 ? "+" : ""}
                {item.points}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
