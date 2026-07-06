"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { completeWorkout } from "@/lib/actions/gym";

export function CompleteWorkoutButton({ workoutId }: { workoutId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleComplete() {
    startTransition(async () => {
      await completeWorkout(workoutId);
      router.refresh();
    });
  }

  return (
    <Button size="sm" onClick={handleComplete} disabled={isPending}>
      {isPending ? "Saving..." : "Complete"}
    </Button>
  );
}
