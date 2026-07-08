"use client";

import { useTransition } from "react";
import { format, parseISO } from "date-fns";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deletePayment } from "@/lib/actions/finance";
import {
  EditPaymentDialog,
  formatPaymentMethod,
} from "@/components/finance/EditPaymentDialog";
import { formatCurrency } from "@/lib/finance/format";
import type { CreditCardPayment } from "@/types/finance";

export function PaymentHistoryList({
  payments,
  readOnly = false,
}: {
  payments: CreditCardPayment[];
  readOnly?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  if (payments.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        No payments recorded yet.
      </p>
    );
  }

  function handleDelete(paymentId: string) {
    startTransition(async () => {
      await deletePayment(paymentId);
    });
  }

  return (
    <div className="space-y-2">
      {payments.map((payment) => (
        <div
          key={payment.id}
          className="flex items-center justify-between gap-3 rounded-xl bg-muted/35 px-3 py-2.5 ring-1 ring-border/40"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium tabular-nums">
                {formatCurrency(payment.amount)}
              </p>
              <Badge
                variant={payment.status === "completed" ? "secondary" : "outline"}
                className="text-[10px]"
              >
                {payment.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(payment.payment_date), "MMM d, yyyy")}
              {" · "}
              {formatPaymentMethod(payment.payment_method)}
              {payment.note ? ` · ${payment.note}` : ""}
            </p>
          </div>
          {!readOnly && (
            <div className="flex shrink-0 items-center gap-0.5">
              <EditPaymentDialog payment={payment} />
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      disabled={isPending}
                      aria-label="Payment actions"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => handleDelete(payment.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
