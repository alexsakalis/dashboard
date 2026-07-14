"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { saveJournalEntry } from "@/lib/actions/notes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function JournalEditor({
  date,
  initialBody,
}: {
  date: string;
  initialBody: string;
}) {
  const [body, setBody] = useState(initialBody);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    startTransition(async () => {
      await saveJournalEntry(body, date);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="journal-body">
          {format(new Date(`${date}T12:00:00`), "EEEE, MMMM d")}
        </Label>
        <textarea
          id="journal-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="How did today go? Wins, blockers, intentions for tomorrow..."
          rows={8}
          className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <Button
        type="button"
        className="w-full"
        disabled={isPending}
        onClick={handleSave}
      >
        {isPending ? "Saving..." : saved ? "Saved" : "Save entry"}
      </Button>
    </div>
  );
}
