import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  calculateDailyProgress,
  DAILY_SCORE_GOAL,
} from "@/lib/scoring/daily-score";
import { getTodayScore } from "@/lib/scoring/actions";
import { requireUser } from "@/lib/auth";

export async function DailyScoreCard() {
  const user = await requireUser();
  const score = await getTodayScore(user.id);
  const progress = calculateDailyProgress(score.total_score);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Daily Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-bold tabular-nums">{score.total_score}</p>
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
