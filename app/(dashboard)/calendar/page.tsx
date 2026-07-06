import { format } from "date-fns";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  getCalendarEvents,
  getUpcomingCalendarEvents,
} from "@/lib/actions/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

async function CalendarView() {
  const [todayEvents, upcomingEvents] = await Promise.all([
    getCalendarEvents(20),
    getUpcomingCalendarEvents(20),
  ]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Today</h2>
        {todayEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events today.</p>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
      <section>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Upcoming</h2>
        {upcomingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No upcoming events.</p>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function EventCard({
  event,
}: {
  event: {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    all_day: boolean;
    location: string | null;
  };
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{event.title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        <p>
          {event.all_day
            ? "All day"
            : `${format(new Date(event.start_time), "h:mm a")} – ${format(new Date(event.end_time), "h:mm a")}`}
        </p>
        {event.location && <p className="mt-1">{event.location}</p>}
      </CardContent>
    </Card>
  );
}

export default function CalendarPage() {
  return (
    <>
      <PageHeader
        title="Calendar"
        subtitle="Synced via Google Calendar"
      />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <CalendarView />
        </Suspense>
      </main>
    </>
  );
}
