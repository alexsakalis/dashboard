"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteWorkout } from "@/lib/actions/gym";

export function DeleteWorkoutDialog({
  workoutId,
  mode = "completed",
}: {
  workoutId: string;
  mode?: "active" | "completed";
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isActive = mode === "active";

  function handleDelete() {
    startTransition(async () => {
      await deleteWorkout(workoutId);
      setOpen(false);
      router.push("/gym");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={isActive ? "outline" : "ghost"}
            size={isActive ? "sm" : "icon"}
            className={
              isActive
                ? "text-destructive hover:text-destructive"
                : "text-muted-foreground hover:text-destructive"
            }
          >
            {isActive ? (
              "Discard"
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isActive ? "Discard workout?" : "Delete workout?"}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {isActive
            ? "This will permanently discard the in-progress workout and all logged sets."
            : "This permanently removes the workout and all logged sets."}
        </p>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? "Removing..." : isActive ? "Discard" : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
