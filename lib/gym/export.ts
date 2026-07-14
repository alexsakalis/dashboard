import { format, parseISO } from "date-fns";
import { flattenSets } from "@/lib/gym/enrich";
import type { Workout } from "@/types/gym";

function escapeCsv(value: string | number | null | undefined): string {
  if (value == null) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function workoutsToCsv(workouts: Workout[]): string {
  const header =
    "date,workout,split,exercise,set,weight,reps,rpe,warmup,rest_seconds,notes";

  const rows: string[] = [header];

  for (const workout of workouts.filter((w) => w.completed_at)) {
    const date = format(parseISO(workout.completed_at!), "yyyy-MM-dd");
    const sets = flattenSets(workout).sort((a, b) => {
      const ex = a.exercise_name.localeCompare(b.exercise_name);
      return ex !== 0 ? ex : a.set_number - b.set_number;
    });

    for (const set of sets) {
      rows.push(
        [
          date,
          workout.name,
          workout.split ?? "",
          set.exercise_name,
          set.set_number,
          set.weight ?? "",
          set.reps ?? "",
          set.rpe ?? "",
          set.is_warmup ? "yes" : "no",
          set.rest_seconds ?? "",
          set.notes ?? "",
        ]
          .map(escapeCsv)
          .join(","),
      );
    }
  }

  return rows.join("\n");
}
