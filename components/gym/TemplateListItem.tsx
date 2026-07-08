"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Play, Pencil } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { startWorkoutFromTemplate } from "@/lib/actions/gym";
import { formatSplit } from "@/lib/gym/format";
import type { WorkoutTemplate } from "@/types/gym";

export function TemplateListItem({ template }: { template: WorkoutTemplate }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const exercises =
    template.workout_template_exercises ?? template.exercises ?? [];

  function handleStart() {
    startTransition(async () => {
      const workout = await startWorkoutFromTemplate(template.id);
      router.push(`/gym/${workout.id}`);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle className="text-base">{template.name}</CardTitle>
          <div className="mt-1 flex flex-wrap gap-1">
            {template.split && (
              <Badge variant="secondary" className="text-xs">
                {formatSplit(template.split)}
              </Badge>
            )}
            {template.is_system && (
              <Badge variant="outline" className="text-xs">
                Default
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          {!template.is_system && (
            <Link
              href={`/gym/templates/${template.id}`}
              className="inline-flex size-7 items-center justify-center rounded-xl hover:bg-muted"
            >
              <Pencil className="h-4 w-4" />
            </Link>
          )}
          <Button size="sm" onClick={handleStart} disabled={isPending}>
            <Play className="mr-1 h-3.5 w-3.5" />
            Start
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {exercises.length} exercise{exercises.length === 1 ? "" : "s"}
        </p>
        <ul className="mt-2 space-y-0.5 text-xs text-muted-foreground">
          {exercises.slice(0, 4).map((ex) => (
            <li key={ex.exercise_name}>
              {ex.exercise_name}
              {ex.default_sets ? ` · ${ex.default_sets} sets` : ""}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
