"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { getExerciseLibrary, createCustomExercise } from "@/lib/actions/gym";
import type { ExerciseLibraryEntry } from "@/types/gym";

interface ExerciseLibraryComboboxProps {
  onSelect: (exercise: ExerciseLibraryEntry) => void;
}

export function ExerciseLibraryCombobox({ onSelect }: ExerciseLibraryComboboxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ExerciseLibraryEntry[]>([]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSearch(value: string) {
    setQuery(value);
    if (value.length < 1) {
      setResults([]);
      return;
    }
    startTransition(async () => {
      const all = await getExerciseLibrary(200);
      const filtered = all.filter((ex) =>
        ex.name.toLowerCase().includes(value.toLowerCase()),
      );
      setResults(filtered.slice(0, 8));
    });
  }

  function handleCreateCustom() {
    if (!query.trim()) return;
    startTransition(async () => {
      const created = await createCustomExercise(query.trim(), "custom");
      onSelect(created);
      setQuery(created.name);
      setResults([]);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search exercises..."
        autoComplete="off"
      />
      {results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-border bg-popover py-1 shadow-md">
          {results.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50"
                onClick={() => {
                  onSelect(ex);
                  setQuery(ex.name);
                  setResults([]);
                }}
              >
                <span>{ex.name}</span>
                <span className="text-xs capitalize text-muted-foreground">
                  {ex.muscle_group}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.length > 1 && results.length === 0 && !isPending && (
        <button
          type="button"
          className="mt-2 text-sm text-primary hover:underline"
          onClick={handleCreateCustom}
        >
          Create &quot;{query}&quot; as custom exercise
        </button>
      )}
    </div>
  );
}
