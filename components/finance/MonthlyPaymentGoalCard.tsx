"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateMonthlyPaymentGoal } from "@/lib/actions/finance";
import { formatCurrency } from "@/lib/finance/format";

export function MonthlyPaymentGoalCard({
  goal,
  paidThisMonth,
}: {
  goal: number | null;
  paidThisMonth: number;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateMonthlyPaymentGoal(formData);
    });
  }

  const progress =
    goal && goal > 0 ? Math.min(100, (paidThisMonth / goal) * 100) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Monthly payment goal
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="monthly_payment_goal" className="sr-only">
              Monthly goal
            </Label>
            <Input
              id="monthly_payment_goal"
              name="monthly_payment_goal"
              type="number"
              step="0.01"
              min="0"
              placeholder="e.g. 500"
              defaultValue={goal != null ? String(goal) : ""}
            />
          </div>
          <Button type="submit" size="sm" variant="outline" disabled={isPending}>
            {isPending ? "..." : "Save"}
          </Button>
        </form>
        {goal != null && goal > 0 && (
          <p className="text-xs text-muted-foreground">
            {formatCurrency(paidThisMonth)} of {formatCurrency(goal)} paid this
            month
            {progress != null && ` (${Math.round(progress)}%)`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
