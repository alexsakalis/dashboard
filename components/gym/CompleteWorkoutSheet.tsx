"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { completeWorkout } from "@/lib/actions/gym";

export function CompleteWorkoutSheet({ workoutId }: { workoutId: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("workout_id", workoutId);

    startTransition(async () => {
      await completeWorkout(formData);
      setOpen(false);
      router.push("/gym");
      router.refresh();
    });
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button size="sm">Complete</Button>} />
      <SheetContent side="bottom">
        <SheetHeader>
          <SheetTitle>Complete workout</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="overall_rpe">Overall RPE (optional)</Label>
            <Input
              id="overall_rpe"
              name="overall_rpe"
              type="number"
              min={1}
              max={10}
              step={0.5}
              placeholder="1–10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body_weight">Body weight (optional)</Label>
            <Input
              id="body_weight"
              name="body_weight"
              type="number"
              min={0}
              step={0.1}
              placeholder="lbs"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              placeholder="How did it feel?"
              rows={3}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Saving..." : "Finish workout"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
