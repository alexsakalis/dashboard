import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { getWorkouts, getRecentPRs, getExerciseHistory } from "@/lib/actions/gym";
import { getExerciseByName, getFavoriteExercises } from "@/lib/actions/exercise-library";
import { buildExerciseProgressSummary } from "@/lib/gym/enrich";
import { ExerciseProgressChart } from "@/components/gym/ExerciseProgressChart";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import {
  EQUIPMENT_LABELS,
  BODY_PART_LABELS,
} from "@/lib/gym/constants";

async function ProgressOverview() {
  const workouts = await getWorkouts({ limit: 50, completedOnly: true });
  const prs = await getRecentPRs(20);
  const favorites = await getFavoriteExercises();

  const exerciseNames = [
    ...new Set(
      workouts.flatMap((w) =>
        (w.workout_sets ?? []).map((s) => s.exercise_name),
      ),
    ),
  ].slice(0, 8);

  const summaries = await Promise.all(
    exerciseNames.map(async (name) => {
      const history = await getExerciseHistory(name, 15);
      const libraryEntry = await getExerciseByName(name);
      return {
        ...buildExerciseProgressSummary(name, history, prs),
        libraryId: libraryEntry?.id ?? null,
        bodyPart: libraryEntry?.body_part ?? null,
        equipment: libraryEntry?.equipment ?? null,
      };
    }),
  );

  const withData = summaries.filter((s) => s.chartPoints.length >= 2);

  const favoriteNotLogged = favorites.filter(
    (fav) => !exerciseNames.some((n) => n.toLowerCase() === fav.name.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {withData.length === 0 && favoriteNotLogged.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          Complete a few workouts to see progress charts.
        </p>
      )}

      {withData.length > 0 && (
        <div className="space-y-4">
          {withData.map((summary) => (
            <Link
              key={summary.exerciseName}
              href={
                summary.libraryId
                  ? `/gym/exercises/${summary.libraryId}`
                  : `/gym/progress/${encodeURIComponent(summary.exerciseName)}`
              }
            >
              <Card className="transition-colors hover:bg-muted/50">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{summary.exerciseName}</p>
                      {(summary.bodyPart || summary.equipment) && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {summary.bodyPart && (
                            <Badge variant="secondary" className="text-[10px]">
                              {BODY_PART_LABELS[summary.bodyPart as keyof typeof BODY_PART_LABELS] ??
                                summary.bodyPart}
                            </Badge>
                          )}
                          {summary.equipment && (
                            <Badge variant="outline" className="text-[10px]">
                              {EQUIPMENT_LABELS[summary.equipment as keyof typeof EQUIPMENT_LABELS] ??
                                summary.equipment}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </div>
                  <ExerciseProgressChart points={summary.chartPoints} />
                  {summary.estimated1RM && (
                    <p className="text-xs text-muted-foreground">
                      Best est. 1RM: {summary.estimated1RM} lbs · Trend: {summary.trend}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {favoriteNotLogged.length > 0 && (
        <div>
          <h2 className="section-label mb-2">Your favorites</h2>
          <div className="space-y-2">
            {favoriteNotLogged.map((ex) => (
              <Link key={ex.id} href={`/gym/exercises/${ex.id}`}>
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex items-center justify-between p-3">
                    <div>
                      <p className="font-medium">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Not logged yet
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GymProgressPage() {
  return (
    <>
      <PageHeader title="Progress" subtitle="Strength & volume trends" />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <ProgressOverview />
        </Suspense>
      </main>
    </>
  );
}
