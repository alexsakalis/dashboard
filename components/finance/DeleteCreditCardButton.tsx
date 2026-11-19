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
import { deleteCreditCard } from "@/lib/actions/finance";

export function DeleteCreditCardButton({
  cardId,
  cardName,
}: {
  cardId: string;
  cardName: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    startTransition(async () => {
      await deleteCreditCard(cardId);
      setOpen(false);
      router.push("/finance");
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            disabled={isPending}
            aria-label="Delete card"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete credit card?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          &ldquo;{cardName}&rdquo; and its payment and balance history will be
          permanently removed.
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
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
