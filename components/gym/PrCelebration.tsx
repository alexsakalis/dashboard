"use client";

import { useEffect } from "react";
import { Trophy, X } from "lucide-react";
import type { DetectedPR } from "@/lib/gym/progress";

const PR_LABELS: Record<string, string> = {
  max_weight: "Max weight",
  max_reps: "Max reps",
  estimated_1rm: "Est. 1RM",
  max_volume_set: "Volume PR",
};

interface PrCelebrationProps {
  pr: DetectedPR | null;
  onDismiss: () => void;
}

export function PrCelebration({ pr, onDismiss }: PrCelebrationProps) {
  useEffect(() => {
    if (!pr) return;
    const id = window.setTimeout(onDismiss, 4000);
    return () => window.clearTimeout(id);
  }, [onDismiss, pr]);

  if (!pr) return null;

  return (
    <div className="fixed inset-x-0 top-[calc(4.5rem+env(safe-area-inset-top))] z-50 mx-auto max-w-lg px-4">
      <div className="flex items-center gap-3 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 shadow-lg backdrop-blur-xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-500">
          <Trophy className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-green-600">New PR!</p>
          <p className="truncate text-sm">
            {pr.exercise_name} · {PR_LABELS[pr.record_type] ?? pr.record_type}
          </p>
          <p className="text-xs text-muted-foreground tabular-nums">
            {Math.round(pr.value)}
            {pr.weight != null && pr.reps != null
              ? ` (${pr.weight} × ${pr.reps})`
              : ""}
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded p-1 text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
