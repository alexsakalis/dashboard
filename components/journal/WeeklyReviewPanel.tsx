import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WeeklyReview } from "@/lib/productivity/weekly-review";

function ReviewStat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | null;
  suffix?: string;
}) {
  return (
    <div className="rounded-xl bg-muted/35 p-3 ring-1 ring-border/40">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums">
        {value != null ? value : "—"}
        {value != null && suffix ? (
          <span className="text-xs font-normal text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </p>
    </div>
  );
}

export function WeeklyReviewPanel({ review }: { review: WeeklyReview }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">This week</CardTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(`${review.weekStart}T12:00:00`), "MMM d")} –{" "}
            {format(new Date(`${review.weekEnd}T12:00:00`), "MMM d")}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-1.5 text-sm">
            {review.highlights.map((line) => (
              <li key={line} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {line}
              </li>
            ))}
          </ul>

          <div className="grid grid-cols-2 gap-3">
            <ReviewStat label="Tasks done" value={review.tasksCompleted} />
            <ReviewStat
              label="Habit rate"
              value={review.habitCompletionRate}
              suffix="%"
            />
            <ReviewStat label="Gym sessions" value={review.gymSessions} />
            <ReviewStat label="Avg daily score" value={review.avgDailyScore} />
            <ReviewStat label="Avg sleep" value={review.avgSleep} />
            <ReviewStat label="Avg readiness" value={review.avgReadiness} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
