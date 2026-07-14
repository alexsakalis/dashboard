import { format } from "date-fns";
import { getHealthSnapshots } from "@/lib/actions/dashboard";
import { getGymDashboard } from "@/lib/actions/gym";
import { buildGymHealthInsight } from "@/lib/gym/health-crossover";
import type { GymDashboardSummary } from "@/types/gym";

function pickTodayHealthMetrics(
  snapshots: Awaited<ReturnType<typeof getHealthSnapshots>>,
) {
  const today = format(new Date(), "yyyy-MM-dd");
  const todaySnapshot = snapshots.find((row) => row.date === today);
  const latest = snapshots.at(-1);

  return {
    readiness:
      todaySnapshot?.readiness_score ?? latest?.readiness_score ?? null,
    hrv:
      todaySnapshot?.hrv_ms != null
        ? Number(todaySnapshot.hrv_ms)
        : latest?.hrv_ms != null
          ? Number(latest.hrv_ms)
          : null,
  };
}

export async function getGymHealthInsight(summary?: GymDashboardSummary) {
  const gymSummary = summary ?? (await getGymDashboard());
  const snapshots = await getHealthSnapshots(7);
  const { readiness, hrv } = pickTodayHealthMetrics(snapshots);

  return buildGymHealthInsight(
    snapshots,
    {
      suggestedSplit: gymSummary.suggestedSplit,
      weeklyWorkouts: gymSummary.weeklyWorkoutCount,
      lastWorkoutDate: gymSummary.lastWorkout?.completed_at
        ? format(new Date(gymSummary.lastWorkout.completed_at), "yyyy-MM-dd")
        : null,
    },
    readiness,
    hrv,
  );
}
