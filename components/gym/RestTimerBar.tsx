"use client";

import { Minus, Plus, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress, ProgressIndicator, ProgressTrack } from "@/components/ui/progress";
import { useWorkoutSession } from "@/components/gym/WorkoutSessionProvider";
import { formatTimerClock } from "@/lib/gym/format";

export function RestTimerBar() {
  const { restTimer, skipRestTimer, adjustRestTimer } = useWorkoutSession();

  if (!restTimer) return null;

  const progress =
    restTimer.totalSeconds > 0
      ? ((restTimer.totalSeconds - restTimer.remainingSeconds) /
          restTimer.totalSeconds) *
        100
      : 0;

  return (
    <div className="fixed inset-x-0 bottom-[calc(9.5rem+env(safe-area-inset-bottom))] z-40 mx-auto max-w-lg px-4">
      <div className="rounded-xl border border-primary/30 bg-card/95 p-3 shadow-lg backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Rest timer
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {restTimer.exerciseName} · Set {restTimer.setNumber}
            </p>
          </div>
          <p className="text-2xl font-semibold tabular-nums text-primary">
            {formatTimerClock(restTimer.remainingSeconds)}
          </p>
        </div>

        <Progress value={progress} className="mb-3 gap-0">
          <ProgressTrack className="h-1">
            <ProgressIndicator className="bg-primary" />
          </ProgressTrack>
        </Progress>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => adjustRestTimer(-15)}
          >
            <Minus className="mr-1 h-3.5 w-3.5" />
            15s
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="flex-1"
            onClick={skipRestTimer}
          >
            <SkipForward className="mr-1 h-3.5 w-3.5" />
            Skip
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => adjustRestTimer(15)}
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            15s
          </Button>
        </div>
      </div>
    </div>
  );
}
