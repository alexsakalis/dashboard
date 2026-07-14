import Link from "next/link";
import { format } from "date-fns";
import {
  Activity,
  Calendar,
  CheckSquare,
  Dumbbell,
  RefreshCw,
  Sparkles,
  Target,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ActivityEvent, ActivityEventKind } from "@/lib/activity/types";

const kindConfig: Record<
  ActivityEventKind,
  { icon: React.ElementType; className: string }
> = {
  task: { icon: CheckSquare, className: "text-blue-500" },
  habit: { icon: Target, className: "text-emerald-500" },
  workout: { icon: Dumbbell, className: "text-orange-500" },
  sync: { icon: RefreshCw, className: "text-violet-500" },
  calendar: { icon: Calendar, className: "text-sky-500" },
  journal: { icon: BookOpen, className: "text-amber-600" },
  score: { icon: Sparkles, className: "text-primary" },
};

function ActivityItem({ event }: { event: ActivityEvent }) {
  const config = kindConfig[event.kind];
  const Icon = config.icon;
  const content = (
    <div className="flex items-start gap-3 rounded-xl border border-border/40 bg-card/40 p-3 transition-colors hover:bg-muted/40">
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/50",
          config.className,
        )}
      >
        {event.emoji ? (
          <span className="text-base">{event.emoji}</span>
        ) : (
          <Icon className="h-4 w-4" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{event.title}</p>
        {event.subtitle && (
          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
            {event.subtitle}
          </p>
        )}
        <p className="mt-1 text-[11px] text-muted-foreground">
          {format(new Date(event.timestamp), "h:mm a")}
          {event.points != null && event.points > 0 && (
            <span className="ml-2 text-primary">+{event.points} pts</span>
          )}
        </p>
      </div>
    </div>
  );

  if (event.href) {
    return (
      <Link href={event.href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}

export function ActivityFeed({
  groups,
}: {
  groups: Array<{ date: string; label: string; events: ActivityEvent[] }>;
}) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-center">
        <Activity className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No activity yet. Complete a task, habit, or workout to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <section key={group.date}>
          <h2 className="section-label mb-2">{group.label}</h2>
          <div className="space-y-2">
            {group.events.map((event) => (
              <ActivityItem key={event.id} event={event} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
