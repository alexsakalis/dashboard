import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { getExerciseProgressSummary } from "@/lib/actions/gym";
import { getExerciseByName } from "@/lib/actions/exercise-library";
import Link from "next/link";
import { ExerciseProgressChart } from "@/components/gym/ExerciseProgressChart";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

async function ExerciseDetail({
  exerciseName,
}: {
  exerciseName: string;
}) {
  const summary = await getExerciseProgressSummary(exerciseName);

  return (
    <div className="space-y-4">
      <ExerciseProgressChart points={summary.chartPoints} />

      <div className="grid grid-cols-2 gap-2">
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Est. 1RM</p>
            <p className="text-xl font-bold tabular-nums">
              {summary.estimated1RM ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Trend</p>
            <Badge variant="secondary" className="mt-1 capitalize">
              {summary.trend}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {summary.bestSet && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm font-medium">Best set</p>
            <p className="mt-1 tabular-nums">
              {summary.bestSet.weight} × {summary.bestSet.reps} (
              {summary.bestSet.estimated1RM} est. 1RM)
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default async function ExerciseProgressPage({
  params,
}: {
  params: Promise<{ exercise: string }>;
}) {
  const { exercise } = await params;
  const exerciseName = decodeURIComponent(exercise);
  const libraryEntry = await getExerciseByName(exerciseName);

  return (
    <>
      <PageHeader
        title={exerciseName}
        subtitle="Exercise progress"
        action={
          libraryEntry ? (
            <Link href={`/gym/exercises/${libraryEntry.id}`}>
              <Button variant="outline" size="sm">
                Library
              </Button>
            </Link>
          ) : undefined
        }
      />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <ExerciseDetail exerciseName={exerciseName} />
        </Suspense>
      </main>
    </>
  );
}
