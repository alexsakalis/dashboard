import type { WorkoutSplit } from "@/types/gym";
import { SPLIT_LABELS } from "@/lib/gym/constants";

export function formatWeight(
  weight: number | null | undefined,
  unit = "lbs",
): string {
  if (weight == null) return "—";
  const rounded = Number.isInteger(weight) ? weight : weight.toFixed(1);
  return `${rounded} ${unit}`;
}

export function formatSplit(split: WorkoutSplit | null | undefined): string {
  if (!split) return "Workout";
  return SPLIT_LABELS[split] ?? split;
}

export function formatDuration(seconds: number | null | undefined): string | null {
  if (seconds == null || seconds <= 0) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

export function formatSetLine(
  weight: number | null,
  reps: number | null,
  unit = "lbs",
): string {
  if (weight == null && reps == null) return "—";
  const w = weight != null ? `${weight}` : "BW";
  const r = reps ?? "—";
  return `${w} × ${r}${weight != null ? ` ${unit}` : ""}`;
}

export function formatRpe(rpe: number | null | undefined): string {
  if (rpe == null) return "";
  return `@${rpe}`;
}

export function formatPercentChange(current: number, previous: number): string {
  if (previous === 0) return "+100%";
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}
