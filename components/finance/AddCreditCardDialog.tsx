"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createCreditCard } from "@/lib/actions/finance";
import { CreditCardFormFields } from "@/components/finance/CreditCardFormFields";

import type { CardStatus } from "@/types/finance";

export function AddCreditCardDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [cardStatus, setCardStatus] = useState<CardStatus>("active");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        await createCreditCard(formData);
        setOpen(false);
        setCardStatus("active");
        e.currentTarget.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save card");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <Plus className="mr-1 h-4 w-4" />
            Add card
          </Button>
        }
      />
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Add credit card</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70dvh] pr-3">
          <form onSubmit={handleSubmit} className="space-y-4 pb-1">
            <CreditCardFormFields
              cardStatus={cardStatus}
              onStatusChange={setCardStatus}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Saving..." : "Save card"}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
