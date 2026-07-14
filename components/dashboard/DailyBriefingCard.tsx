import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Flame,
  ListTodo,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  buildDailyBriefing,
  formatBriefingEventTime,
} from "@/lib/dashboard/daily-briefing";
import { TaskPriorityDot } from "@/components/dashboard/TasksCard";
import type { DashboardSummary } from "@/types";

function StatPill({
  icon: Icon,
  label,
  href,
}: {
  icon: React.ElementType;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-full bg-background/60 px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-border/50 transition-colors hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}

export function DailyBriefingCard({ summary }: { summary: DashboardSummary }) {
  const briefing = buildDailyBriefing(summary);

  return (
    <Card className="border-primary/15 bg-gradient-to-br from-card via-card to-primary/8">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">
              {briefing.greeting}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">{briefing.insight}</p>
          </div>
          <div className="rounded-xl bg-background/60 px-2.5 py-1.5 text-right ring-1 ring-border/50">
            <p className="text-lg font-bold tabular-nums leading-none">
              {briefing.score}
            </p>
            <p className="text-[10px] text-muted-foreground">
              {briefing.scoreProgress}% of goal
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatPill
            icon={ListTodo}
            label={
              briefing.tasksRemaining === 0
                ? "Tasks done"
                : `${briefing.tasksRemaining} task${briefing.tasksRemaining === 1 ? "" : "s"} left`
            }
            href="/tasks"
          />
          {briefing.habitsTotal > 0 && (
            <StatPill
              icon={CheckCircle2}
              label={`${briefing.habitsDone}/${briefing.habitsTotal} habits`}
              href="/habits"
            />
          )}
          {briefing.eventsToday > 0 && (
            <StatPill
              icon={Calendar}
              label={`${briefing.eventsToday} event${briefing.eventsToday === 1 ? "" : "s"}`}
              href="/calendar"
            />
          )}
          {(summary.score_streak ?? 0) > 0 && (
            <StatPill
              icon={Flame}
              label={`${summary.score_streak}d streak`}
              href="/"
            />
          )}
        </div>

        {(briefing.nextEvent || briefing.focusTask) && (
          <div className="space-y-2 rounded-xl bg-background/50 p-3 ring-1 ring-border/40">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" />
              Next up
            </p>
            {briefing.nextEvent ? (
              <div className="flex items-start gap-2">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {briefing.nextEvent.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatBriefingEventTime(
                      briefing.nextEvent.start_time,
                      briefing.nextEvent.all_day,
                    )}
                    {briefing.nextEvent.location &&
                      ` · ${briefing.nextEvent.location}`}
                  </p>
                </div>
              </div>
            ) : briefing.focusTask ? (
              <div className="flex items-start gap-2">
                <TaskPriorityDot priority={briefing.focusTask.priority} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {briefing.focusTask.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Top priority task
                    {briefing.focusTask.due_date &&
                      ` · due ${format(new Date(`${briefing.focusTask.due_date}T12:00:00`), "MMM d")}`}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}

        <Link
          href="/tasks"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Open task list <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
