import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import { ExerciseProgressChart } from "@/components/gym/ExerciseProgressChart";
import {
  ExerciseDetailActions,
  ExerciseMetadataCard,
} from "@/components/gym/ExerciseDetailSections";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getExerciseById } from "@/lib/actions/exercise-library";
import {
  getExerciseProgressSummary,
  getExerciseHistory,
} from "@/lib/actions/gym";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { formatSetLine } from "@/lib/gym/format";
import type { RecordType, ExercisePersonalRecord } from "@/types/gym";

const PR_LABELS: Record<RecordType, string> = {
  max_weight: "Max Weight",
  max_reps: "Max Reps",
  estimated_1rm: "Est. 1RM",
  max_volume_set: "Max Volume",
};

async function getExercisePRs(exerciseName: string): Promise<ExercisePersonalRecord[]> {
  const user = await requireUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("exercise_personal_records")
    .select("*")
    .eq("user_id", user.id)
    .eq("exercise_name", exerciseName);
  return (data ?? []) as ExercisePersonalRecord[];
}

async function ExerciseDetailContent({ id }: { id: string }) {
  const exercise = await getExerciseById(id);
  if (!exercise) notFound();

  const [summary, history, prs] = await Promise.all([
    getExerciseProgressSummary(exercise.name),
    getExerciseHistory(exercise.name, 10),
    getExercisePRs(exercise.name),
  ]);

  return (
    <div className="space-y-4">
      <ExerciseMetadataCard exercise={exercise} />

      {prs.length > 0 && (
        <div>
          <h2 className="section-label mb-2">Personal records</h2>
          <div className="grid grid-cols-2 gap-2">
            {prs.map((pr) => (
              <Card key={pr.record_type}>
                <CardContent className="p-3">
                  <p className="text-xs text-muted-foreground">
                    {PR_LABELS[pr.record_type]}
                  </p>
                  <p className="text-lg font-bold tabular-nums">
                    {pr.record_type === "estimated_1rm" || pr.record_type === "max_volume_set"
                      ? Math.round(pr.value)
                      : pr.weight != null
                        ? `${pr.weight}${pr.reps != null ? ` × ${pr.reps}` : ""}`
                        : pr.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {summary.chartPoints.length >= 2 && (
        <div>
          <h2 className="section-label mb-2">Progress</h2>
          <Card>
            <CardContent className="p-4">
              <ExerciseProgressChart points={summary.chartPoints} />
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Est. 1RM</p>
                  <p className="text-lg font-bold tabular-nums">
                    {summary.estimated1RM ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Trend</p>
                  <Badge variant="secondary" className="mt-0.5 capitalize">
                    {summary.trend}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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

      {history.length > 0 && (
        <div>
          <h2 className="section-label mb-2">History</h2>
          <div className="space-y-2">
            {history.map((workout) => {
              const sets = (workout.workout_sets ?? []).filter(
                (s) => s.exercise_name === exercise.name && !s.is_warmup,
              );
              if (sets.length === 0) return null;

              return (
                <Link key={workout.id} href={`/gym/${workout.id}`}>
                  <Card className="transition-colors hover:bg-muted/50">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {format(new Date(workout.completed_at!), "MMM d, yyyy")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {sets.length} set{sets.length === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {sets
                          .slice(0, 3)
                          .map((s) => formatSetLine(s.weight, s.reps, s.unit))
                          .join(" · ")}
                        {sets.length > 3 && " · ..."}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {history.length === 0 && summary.chartPoints.length < 2 && (
        <p className="py-4 text-center text-sm text-muted-foreground">
          No workout history yet. Add this exercise to a workout to track progress.
        </p>
      )}
    </div>
  );
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exercise = await getExerciseById(id);
  if (!exercise) notFound();

  return (
    <>
      <PageHeader
        title={exercise.name}
        subtitle={exercise.muscle_group}
        action={<ExerciseDetailActions exercise={exercise} />}
      />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <ExerciseDetailContent id={id} />
        </Suspense>
      </main>
    </>
  );
}
