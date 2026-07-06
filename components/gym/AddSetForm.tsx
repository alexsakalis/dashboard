"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { addWorkoutSet } from "@/lib/actions/gym";

export function AddSetForm({ workoutId }: { workoutId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("workout_id", workoutId);
    startTransition(async () => {
      await addWorkoutSet(formData);
      e.currentTarget.reset();
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Add Set</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="exercise_name">Exercise</Label>
            <Input
              id="exercise_name"
              name="exercise_name"
              required
              placeholder="Bench Press"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="set_number">Set #</Label>
              <Input
                id="set_number"
                name="set_number"
                type="number"
                min={1}
                defaultValue={1}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reps">Reps</Label>
              <Input id="reps" name="reps" type="number" min={0} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                min={0}
                step={0.5}
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Adding..." : "Add Set"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
