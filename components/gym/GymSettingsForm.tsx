"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateGymPreferences } from "@/lib/actions/gym";
import { WORKOUT_SPLITS, SPLIT_LABELS, DEFAULT_REST_SECONDS } from "@/lib/gym/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { GymPreferences } from "@/types/gym";

export function GymSettingsForm({
  preferences,
}: {
  preferences: GymPreferences | null;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selectedSplits = new Set(
    preferences?.preferred_splits ?? ["push", "pull", "legs"],
  );

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateGymPreferences(formData);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="default_weight_unit">Weight unit</Label>
        <select
          id="default_weight_unit"
          name="default_weight_unit"
          defaultValue={preferences?.default_weight_unit ?? "lbs"}
          className="flex h-9 w-full rounded-xl border border-input bg-transparent px-3 text-sm"
        >
          <option value="lbs">Pounds (lbs)</option>
          <option value="kg">Kilograms (kg)</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="default_rest_seconds">Default rest timer</Label>
        <Input
          id="default_rest_seconds"
          name="default_rest_seconds"
          type="number"
          min={15}
          max={600}
          step={15}
          defaultValue={preferences?.default_rest_seconds ?? DEFAULT_REST_SECONDS}
        />
        <p className="text-xs text-muted-foreground">Seconds between working sets</p>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Split rotation</legend>
        <p className="text-xs text-muted-foreground">
          Used for suggested next workout on the dashboard
        </p>
        <div className="grid grid-cols-2 gap-2">
          {WORKOUT_SPLITS.filter((s) => s !== "custom").map((split) => (
            <label
              key={split}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <Checkbox
                name="preferred_splits"
                value={split}
                defaultChecked={selectedSplits.has(split)}
              />
              {SPLIT_LABELS[split]}
            </label>
          ))}
        </div>
      </fieldset>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Saving..." : "Save preferences"}
      </Button>
    </form>
  );
}
