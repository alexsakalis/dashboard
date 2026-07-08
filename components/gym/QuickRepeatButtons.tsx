"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SPLIT_LABELS } from "@/lib/gym/constants";
import { getLastWorkoutBySplit, duplicateWorkoutAsNew } from "@/lib/actions/gym";
import type { WorkoutSplit } from "@/types/gym";

const QUICK_SPLITS: WorkoutSplit[] = ["push", "pull", "legs", "upper", "lower"];

export function QuickRepeatButtons() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function repeatSplit(split: WorkoutSplit) {
    startTransition(async () => {
      const last = await getLastWorkoutBySplit(split);
      if (!last) {
        router.push(`/gym?start=${split}`);
        return;
      }
      const workout = await duplicateWorkoutAsNew(last.id, {
        copySets: true,
        name: `${SPLIT_LABELS[split]} Day`,
      });
      router.push(`/gym/${workout.id}`);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {QUICK_SPLITS.map((split) => (
        <Button
          key={split}
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => repeatSplit(split)}
          className="text-xs"
        >
          Repeat {SPLIT_LABELS[split]}
        </Button>
      ))}
    </div>
  );
}
