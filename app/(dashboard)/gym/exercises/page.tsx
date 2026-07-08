import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { ExerciseLibraryFilters } from "@/components/gym/ExerciseLibraryFilters";
import { ExerciseLibraryList } from "@/components/gym/ExerciseLibraryList";
import { CreateCustomExerciseSheet } from "@/components/gym/CreateCustomExerciseSheet";
import { ExerciseLibrarySearch } from "@/components/gym/ExerciseLibrarySearch";
import { getExerciseLibraryFiltered } from "@/lib/actions/exercise-library";
import type {
  BodyPart,
  DifficultyLevel,
  EquipmentType,
  MovementType,
  WorkoutSplit,
} from "@/types/gym";

interface ExercisesPageProps {
  searchParams: Promise<{
    q?: string;
    bodyPart?: string;
    equipment?: string;
    difficulty?: string;
    split?: string;
    movementType?: string;
    favorites?: string;
    hidden?: string;
  }>;
}

async function ExerciseLibraryContent({
  searchParams,
}: {
  searchParams: ExercisesPageProps["searchParams"];
}) {
  const params = await searchParams;

  const exercises = await getExerciseLibraryFiltered({
    query: params.q,
    bodyPart: (params.bodyPart as BodyPart) ?? "all",
    equipment: (params.equipment as EquipmentType) ?? "all",
    difficulty: (params.difficulty as DifficultyLevel) ?? "all",
    split: (params.split as WorkoutSplit) ?? "all",
    movementType: (params.movementType as MovementType) ?? "all",
    favoritesOnly: params.favorites === "true",
    includeHidden: params.hidden === "true",
  });

  const hasActiveFilters =
    params.bodyPart ||
    params.equipment ||
    params.difficulty ||
    params.split ||
    params.movementType ||
    params.favorites === "true" ||
    params.q;

  return (
    <div className="space-y-4">
      <ExerciseLibrarySearch defaultQuery={params.q} />
      <ExerciseLibraryFilters />
      <ExerciseLibraryList
        exercises={exercises}
        groupByBodyPart={!hasActiveFilters}
      />
    </div>
  );
}

export default function ExercisesPage({ searchParams }: ExercisesPageProps) {
  return (
    <>
      <PageHeader
        title="Exercise Library"
        subtitle="Browse, search & manage exercises"
        action={<CreateCustomExerciseSheet />}
      />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <ExerciseLibraryContent searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
