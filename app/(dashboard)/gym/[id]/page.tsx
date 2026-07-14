import { notFound } from "next/navigation";
import {
  getWorkout,
  getLastWorkoutReference,
  enrichWorkout,
  getAllPersonalRecords,
  getGymPreferences,
} from "@/lib/actions/gym";
import { DEFAULT_REST_SECONDS } from "@/lib/gym/constants";
import { WorkoutDetailView } from "@/components/gym/WorkoutDetailView";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await getWorkout(id);
  if (!workout) notFound();

  const enriched = enrichWorkout(workout);
  const [lastRef, existingPRs, preferences] = await Promise.all([
    workout.split ? getLastWorkoutReference(workout.split) : Promise.resolve(null),
    getAllPersonalRecords(),
    getGymPreferences(),
  ]);

  const reference =
    lastRef?.workoutId !== workout.id ? lastRef : null;

  const defaultRestSeconds =
    preferences?.default_rest_seconds ?? DEFAULT_REST_SECONDS;

  return (
    <WorkoutDetailView
      workout={workout}
      enriched={enriched}
      lastReference={reference}
      existingPRs={existingPRs}
      preferences={preferences}
      defaultRestSeconds={defaultRestSeconds}
    />
  );
}
