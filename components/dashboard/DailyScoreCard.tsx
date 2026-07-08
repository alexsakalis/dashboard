import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  calculateDailyProgress,
  DAILY_SCORE_GOAL,
} from "@/lib/scoring/daily-score";
import type { DashboardSummary } from "@/types";

export function DailyScoreCard({ summary }: { summary: DashboardSummary }) {
  const score = summary.card_data.daily_score_detail;
  const progress = calculateDailyProgress(score.total_score);

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Daily Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-4xl font-bold tabular-nums tracking-tight">
              {score.total_score}
            </p>
            <p className="text-sm text-muted-foreground">
              / {DAILY_SCORE_GOAL} goal
            </p>
          </div>
          <div className="text-right text-sm text-muted-foreground">
            <p>{score.tasks_completed} tasks</p>
            <p>{score.habits_completed} habits</p>
          </div>
        </div>
        <Progress value={progress} className="mt-4 h-2" />
        <p className="mt-2 text-xs text-muted-foreground">
          {progress}% of daily goal
          {score.streak_bonus > 0 && ` · +${score.streak_bonus} streak bonus`}
        </p>
      </CardContent>
    </Card>
  );
}
