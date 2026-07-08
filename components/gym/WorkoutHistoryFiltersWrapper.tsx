import { Suspense } from "react";
import { WorkoutHistoryFilters } from "@/components/gym/WorkoutHistoryFilters";

export function WorkoutHistoryFiltersWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <Suspense fallback={null}>
        <WorkoutHistoryFilters />
      </Suspense>
      {children}
    </div>
  );
}
