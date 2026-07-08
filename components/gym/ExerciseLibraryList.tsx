import { Card } from "@/components/ui/card";
import { ExerciseLibraryItem } from "@/components/gym/ExerciseLibraryItem";
import { getBodyPartLabel } from "@/lib/gym/exercise-library";
import { BODY_PARTS } from "@/lib/gym/constants";
import type { EnrichedExerciseLibraryEntry, BodyPart } from "@/types/gym";

interface ExerciseLibraryListProps {
  exercises: EnrichedExerciseLibraryEntry[];
  groupByBodyPart?: boolean;
}

export function ExerciseLibraryList({
  exercises,
  groupByBodyPart = true,
}: ExerciseLibraryListProps) {
  if (exercises.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No exercises match your filters.
      </p>
    );
  }

  if (!groupByBodyPart) {
    return (
      <Card className="gap-0 overflow-hidden py-0">
        {exercises.map((entry, index) => (
          <div
            key={entry.id}
            className={
              index < exercises.length - 1 ? "border-b border-border" : ""
            }
          >
            <ExerciseLibraryItem entry={entry} />
          </div>
        ))}
      </Card>
    );
  }

  const grouped = new Map<BodyPart, EnrichedExerciseLibraryEntry[]>();
  for (const part of BODY_PARTS) grouped.set(part, []);
  for (const entry of exercises) {
    const list = grouped.get(entry.body_part as BodyPart);
    if (list) list.push(entry);
  }

  const nonEmpty = BODY_PARTS.filter(
    (part) => (grouped.get(part)?.length ?? 0) > 0,
  );

  return (
    <div className="space-y-4">
      {nonEmpty.map((part) => {
        const items = grouped.get(part)!;
        return (
          <div key={part}>
            <h2 className="section-label mb-2">
              {getBodyPartLabel(part)}{" "}
              <span className="font-normal text-muted-foreground">
                ({items.length})
              </span>
            </h2>
            <Card className="gap-0 overflow-hidden py-0">
              {items.map((entry, index) => (
                <div
                  key={entry.id}
                  className={
                    index < items.length - 1 ? "border-b border-border" : ""
                  }
                >
                  <ExerciseLibraryItem entry={entry} />
                </div>
              ))}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
