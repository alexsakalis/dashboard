"use client";

import Link from "next/link";
import { ChevronRight, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { WorkoutElapsedTimer } from "@/components/gym/WorkoutElapsedTimer";
import { formatSplit } from "@/lib/gym/format";
import type { Workout } from "@/types/gym";

export function ActiveWorkoutBanner({ workout }: { workout: Workout }) {
  return (
    <Link href={`/gym/${workout.id}`} className="block">
      <Card className="gap-0 overflow-hidden border-primary/40 bg-primary/5 py-0 transition-colors hover:bg-primary/10 active:bg-primary/15">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Timer className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Workout in progress
            </p>
            <p className="truncate font-medium">{workout.name}</p>
            {workout.split && (
              <p className="text-xs text-muted-foreground">
                {formatSplit(workout.split)}
              </p>
            )}
          </div>
          <WorkoutElapsedTimer startedAt={workout.started_at} compact />
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </Card>
    </Link>
  );
}
