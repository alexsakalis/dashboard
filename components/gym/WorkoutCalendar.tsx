"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatSplit } from "@/lib/gym/format";
import { shiftMonthKey } from "@/lib/gym/calendar";
import type { WorkoutCalendarMonth } from "@/lib/gym/calendar";
import type { WorkoutSplit } from "@/types/gym";

const SPLIT_DOT: Record<WorkoutSplit, string> = {
  push: "bg-orange-500",
  pull: "bg-sky-500",
  legs: "bg-violet-500",
  upper: "bg-amber-500",
  lower: "bg-emerald-500",
  full_body: "bg-rose-500",
  custom: "bg-muted-foreground",
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface WorkoutCalendarProps {
  calendar: WorkoutCalendarMonth;
}

export function WorkoutCalendar({ calendar }: WorkoutCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayEntry = calendar.days.find((d) => d.date === today);
    return todayEntry?.workouts.length ? today : null;
  });

  const selectedWorkouts = useMemo(
    () => calendar.days.find((d) => d.date === selectedDate)?.workouts ?? [],
    [calendar.days, selectedDate],
  );

  const prevMonth = shiftMonthKey(calendar.monthKey, -1);
  const nextMonth = shiftMonthKey(calendar.monthKey, 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" size="icon" render={<Link href={`/gym/calendar?month=${prevMonth}`} />}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-semibold">{calendar.label}</p>
          <p className="text-xs text-muted-foreground">
            {calendar.completedCount} completed
            {calendar.workoutCount > calendar.completedCount &&
              ` · ${calendar.workoutCount - calendar.completedCount} in progress`}
          </p>
        </div>
        <Button variant="outline" size="icon" render={<Link href={`/gym/calendar?month=${nextMonth}`} />}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardContent className="p-3">
          <div className="mb-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((day) => (
              <p
                key={day}
                className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {day}
              </p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendar.days.map((day) => {
              const isSelected = selectedDate === day.date;
              const hasWorkouts = day.workouts.length > 0;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() =>
                    setSelectedDate((current) =>
                      hasWorkouts ? (current === day.date ? null : day.date) : null,
                    )
                  }
                  className={cn(
                    "flex min-h-[3.25rem] flex-col items-center rounded-lg border p-1.5 transition-colors",
                    day.inMonth ? "border-border/50" : "border-transparent opacity-40",
                    day.isToday && "border-primary/40 bg-primary/5",
                    isSelected && "border-primary bg-primary/10",
                    hasWorkouts && "hover:bg-muted/50",
                    !hasWorkouts && "cursor-default",
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium tabular-nums",
                      day.isToday && "text-primary",
                    )}
                  >
                    {format(parseISO(`${day.date}T12:00:00`), "d")}
                  </span>
                  {hasWorkouts && (
                    <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                      {day.workouts.slice(0, 3).map((workout) => (
                        <span
                          key={workout.id}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            workout.split
                              ? SPLIT_DOT[workout.split]
                              : workout.completed
                                ? "bg-primary"
                                : "bg-amber-400",
                          )}
                          title={workout.name}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        {(Object.entries(SPLIT_DOT) as [WorkoutSplit, string][]).slice(0, 6).map(
          ([split, color]) => (
            <span key={split} className="inline-flex items-center gap-1">
              <span className={cn("h-2 w-2 rounded-full", color)} />
              {formatSplit(split)}
            </span>
          ),
        )}
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-400" />
          In progress
        </span>
      </div>

      {selectedDate && (
        <div className="space-y-2">
          <h2 className="section-label">
            {format(parseISO(`${selectedDate}T12:00:00`), "EEEE, MMM d")}
          </h2>
          {selectedWorkouts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No workouts this day.</p>
          ) : (
            selectedWorkouts.map((workout) => (
              <Link key={workout.id} href={`/gym/${workout.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{workout.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {workout.workingSets} working sets
                        {workout.durationMinutes != null &&
                          ` · ${workout.durationMinutes} min`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {workout.split && (
                        <Badge variant="secondary" className="text-[10px]">
                          {formatSplit(workout.split)}
                        </Badge>
                      )}
                      {!workout.completed && (
                        <Badge variant="outline" className="text-[10px]">
                          Active
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
