"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteCreditCard } from "@/lib/actions/finance";

export function DeleteCreditCardButton({ cardId }: { cardId: string }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteCreditCard(cardId);
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      className="shrink-0 text-muted-foreground hover:text-destructive"
      disabled={isPending}
      onClick={handleDelete}
      aria-label="Delete card"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
