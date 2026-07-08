import { format, subDays } from "date-fns";
import { getOuraAccessToken } from "@/lib/integrations/oura/oauth";
import type { Integration } from "@/types";

const OURA_BASE = "https://api.ouraring.com";

function formatOuraApiError(status: number, body: string): string {
  const lower = body.toLowerCase();
  if (status === 401 || lower.includes("expired") || lower.includes("invalid")) {
    return "Oura session expired. Disconnect and reconnect Oura in Settings.";
  }
  if (status === 403) {
    return "Oura denied access. Reconnect and approve all requested permissions.";
  }
  return `Oura API error (${status})`;
}

export interface OuraDailyData {
  date: string;
  sleep_score: number | null;
  sleep_duration_min: number | null;
  readiness_score: number | null;
  hrv_ms: number | null;
  resting_hr: number | null;
  steps: number | null;
  active_calories: number | null;
  activity_score: number | null;
  workout_count: number;
}

async function ouraFetch<T>(
  token: string,
  path: string,
  params: Record<string, string>,
): Promise<T> {
  const url = new URL(`${OURA_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(formatOuraApiError(res.status, await res.text()));
  }

  return res.json() as Promise<T>;
}

export async function fetchOuraData(
  integration: Integration,
  daysBack = 3,
): Promise<OuraDailyData[]> {
  const token = await getOuraAccessToken(integration);

  const endDate = format(new Date(), "yyyy-MM-dd");
  const startDate = format(subDays(new Date(), daysBack), "yyyy-MM-dd");
  const params = { start_date: startDate, end_date: endDate };

  const [readiness, dailySleep, sleep, activity, workouts] = await Promise.all([
    ouraFetch<{ data: Array<{ day: string; score: number | null }> }>(
      token,
      "/v2/usercollection/daily_readiness",
      params,
    ),
    ouraFetch<{ data: Array<{ day: string; score: number | null }> }>(
      token,
      "/v2/usercollection/daily_sleep",
      params,
    ),
    ouraFetch<{
      data: Array<{
        day: string;
        total_sleep_duration: number | null;
        average_hrv: number | null;
        lowest_heart_rate: number | null;
      }>;
    }>(token, "/v2/usercollection/sleep", params),
    ouraFetch<{
      data: Array<{
        day: string;
        steps: number | null;
        active_calories: number | null;
        score: number | null;
      }>;
    }>(token, "/v2/usercollection/daily_activity", params),
    ouraFetch<{ data: Array<{ day: string }> }>(
      token,
      "/v2/usercollection/workout",
      params,
    ),
  ]);

  const dates = new Set<string>();
  [
    ...readiness.data,
    ...dailySleep.data,
    ...sleep.data,
    ...activity.data,
    ...workouts.data,
  ].forEach((item) => dates.add(item.day));

  return Array.from(dates).map((date) => {
    const readinessItem = readiness.data.find((d) => d.day === date);
    const sleepScoreItem = dailySleep.data.find((d) => d.day === date);
    const sleepItem = sleep.data.find((d) => d.day === date);
    const activityItem = activity.data.find((d) => d.day === date);
    const workoutCount = workouts.data.filter((d) => d.day === date).length;

    return {
      date,
      sleep_score: sleepScoreItem?.score ?? null,
      sleep_duration_min: sleepItem?.total_sleep_duration
        ? Math.round(sleepItem.total_sleep_duration / 60)
        : null,
      readiness_score: readinessItem?.score ?? null,
      hrv_ms: sleepItem?.average_hrv ?? null,
      resting_hr: sleepItem?.lowest_heart_rate ?? null,
      steps: activityItem?.steps ?? null,
      active_calories: activityItem?.active_calories ?? null,
      activity_score: activityItem?.score ?? null,
      workout_count: workoutCount,
    };
  });
}
