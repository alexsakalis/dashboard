"use client";

import { Timer } from "lucide-react";
import { formatTimerClock } from "@/lib/gym/format";
import { useElapsedSeconds } from "@/components/gym/useElapsedSeconds";
import { cn } from "@/lib/utils";

interface WorkoutElapsedTimerProps {
  startedAt: string;
  className?: string;
  compact?: boolean;
}

export function WorkoutElapsedTimer({
  startedAt,
  className,
  compact = false,
}: WorkoutElapsedTimerProps) {
  const elapsed = useElapsedSeconds(startedAt);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-primary",
        compact ? "text-xs" : "text-sm",
        className,
      )}
    >
      <Timer className={cn(compact ? "h-3 w-3" : "h-3.5 w-3.5")} />
      <span className="font-medium tabular-nums">{formatTimerClock(elapsed)}</span>
    </div>
  );
}
