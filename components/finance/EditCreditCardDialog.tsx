"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { updateCreditCard } from "@/lib/actions/finance";
import { CreditCardFormFields } from "@/components/finance/CreditCardFormFields";
import type { EnrichedCreditCard } from "@/types/finance";

export function EditCreditCardDialog({ entry }: { entry: EnrichedCreditCard }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [cardStatus, setCardStatus] = useState(entry.card.card_status);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await updateCreditCard(entry.card.id, formData);
        setOpen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not update card");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Edit
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Edit card</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70dvh] pr-3">
          <form onSubmit={handleSubmit} className="space-y-4 pb-1">
            <CreditCardFormFields
              cardStatus={cardStatus}
              onStatusChange={setCardStatus}
              showEffectiveBalance
              defaultValues={{
                ...entry.card,
                effective_balance: entry.effectiveBalance,
              }}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
