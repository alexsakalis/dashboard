"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WORKOUT_SPLITS, SPLIT_LABELS } from "@/lib/gym/constants";
import { useRouter, useSearchParams } from "next/navigation";

export function WorkoutHistoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParams.get("split") ?? "all";

  function setSplit(split: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (split === "all") params.delete("split");
    else params.set("split", split);
    router.push(`/gym/history?${params.toString()}`);
  }

  return (
    <Tabs value={current} onValueChange={setSplit}>
      <TabsList className="h-auto w-full flex-wrap">
        <TabsTrigger value="all" className="text-xs">
          All
        </TabsTrigger>
        {WORKOUT_SPLITS.filter((s) => s !== "custom").map((split) => (
          <TabsTrigger key={split} value={split} className="text-xs">
            {SPLIT_LABELS[split]}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
