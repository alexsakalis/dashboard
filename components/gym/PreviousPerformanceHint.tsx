"use client";

import { formatSetLine } from "@/lib/gym/format";

interface PreviousPerformanceHintProps {
  sets: { reps: number | null; weight: number | null; isWarmup?: boolean; is_warmup?: boolean }[];
}

export function PreviousPerformanceHint({ sets }: PreviousPerformanceHintProps) {
  const working = sets.filter((s) => !(s.isWarmup ?? s.is_warmup));
  if (working.length === 0) return null;

  const summary = working
    .map((s) => formatSetLine(s.weight, s.reps))
    .join(" · ");

  return (
    <p className="text-xs text-muted-foreground">
      Last time: {summary}
    </p>
  );
}
