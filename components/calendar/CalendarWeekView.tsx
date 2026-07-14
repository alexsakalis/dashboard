import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface WeekEvent {
  id: string;
  title: string;
  start_time: string;
  all_day: boolean;
}

export function CalendarWeekView({ events }: { events: WeekEvent[] }) {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 });
  const end = endOfWeek(now, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });

  return (
    <div className="grid grid-cols-7 gap-1">
      {days.map((day) => {
        const dayEvents = events.filter((event) =>
          isSameDay(new Date(event.start_time), day),
        );
        const isToday = isSameDay(day, now);

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "rounded-xl border border-border/40 p-2 text-center",
              isToday && "border-primary/40 bg-primary/5",
            )}
          >
            <p className="text-[10px] uppercase text-muted-foreground">
              {format(day, "EEE")}
            </p>
            <p
              className={cn(
                "mt-0.5 text-sm font-semibold tabular-nums",
                isToday && "text-primary",
              )}
            >
              {format(day, "d")}
            </p>
            {dayEvents.length > 0 ? (
              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <p
                    key={event.id}
                    className="truncate text-[10px] text-muted-foreground"
                    title={event.title}
                  >
                    {event.all_day
                      ? event.title
                      : `${format(new Date(event.start_time), "h:mm")} ${event.title}`}
                  </p>
                ))}
                {dayEvents.length > 2 && (
                  <p className="text-[10px] text-muted-foreground">
                    +{dayEvents.length - 2} more
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-[10px] text-muted-foreground/60">—</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function CalendarWeekSummary({ events }: { events: WeekEvent[] }) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-medium">This week</p>
          <p className="text-xs text-muted-foreground">
            {events.length} event{events.length === 1 ? "" : "s"}
          </p>
        </div>
        <CalendarWeekView events={events} />
      </CardContent>
    </Card>
  );
}
