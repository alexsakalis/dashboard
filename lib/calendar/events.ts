import { startOfDay } from "date-fns";

export interface CalendarEventRange {
  start_time: string;
  end_time: string;
  all_day?: boolean | null;
}

function eventStart(event: CalendarEventRange): Date {
  const start = new Date(event.start_time);
  return event.all_day ? startOfDay(start) : start;
}

function eventEnd(event: CalendarEventRange): Date {
  const end = new Date(event.end_time);
  return event.all_day ? startOfDay(end) : end;
}

export function calendarEventOverlapsRange(
  event: CalendarEventRange,
  rangeStart: Date,
  rangeEndExclusive: Date,
): boolean {
  return eventStart(event) < rangeEndExclusive && eventEnd(event) > rangeStart;
}
