import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardSummary } from "@/types";

export function CalendarCard({
  summary,
  nextEvent,
}: {
  summary: DashboardSummary;
  nextEvent?: {
    title: string;
    start_time: string;
    all_day: boolean;
    location: string | null;
  } | null;
}) {
  const events = summary.card_data.calendar_preview;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Today&apos;s Events</CardTitle>
        <Link
          href="/calendar"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          Calendar <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {events.length === 0 ? (
          <div className="py-2 text-center text-sm text-muted-foreground">
            {nextEvent ? (
              <div className="space-y-1 text-left">
                <p>No events today.</p>
                <p className="text-xs">
                  Next: <span className="font-medium text-foreground">{nextEvent.title}</span>
                  {" · "}
                  {format(new Date(nextEvent.start_time), "EEE h:mm a")}
                </p>
              </div>
            ) : (
              <p className="py-2">No events today. Connect Google Calendar in Settings.</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {event.all_day
                      ? "All day"
                      : format(new Date(event.start_time), "h:mm a")}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>
              </div>
            ))}
            {summary.calendar_events_today >= 3 && (
              <p className="text-xs text-muted-foreground">
                Busy day — {summary.calendar_events_today} events scheduled
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
