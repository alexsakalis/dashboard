import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  formatCurrency,
  formatDueDateLabel,
  formatPercent,
} from "@/lib/finance/format";
import type { EnrichedCreditCard } from "@/types/finance";

export function PaymentCycleProgress({ entry }: { entry: EnrichedCreditCard }) {
  const dueLabel = formatDueDateLabel(entry.card.due_date);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">This cycle</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Current balance</p>
            <p className="text-xl font-semibold tabular-nums tracking-tight">
              {formatCurrency(entry.effectiveBalance)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Minimum due</p>
            <p className="text-xl font-semibold tabular-nums tracking-tight">
              {formatCurrency(entry.card.minimum_payment)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Due date</p>
            <p className="font-semibold tabular-nums">
              {entry.card.due_date
                ? format(parseISO(entry.card.due_date), "MMM d")
                : "—"}
            </p>
            {dueLabel && (
              <p className="text-xs text-muted-foreground">{dueLabel}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Paid this cycle</p>
            <p className="font-semibold tabular-nums">
              {formatCurrency(entry.paidThisCycle)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Minimum payment</span>
              <div className="flex items-center gap-2">
                {entry.minimumMet ? (
                  <Badge variant="default" className="text-[10px]">
                    Met
                  </Badge>
                ) : entry.remainingMinimum > 0 ? (
                  <span className="text-muted-foreground">
                    {formatCurrency(entry.remainingMinimum)} left
                  </span>
                ) : null}
              </div>
            </div>
            <Progress value={entry.minimumPayProgress} className="h-2" />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Full balance</span>
              <span className="text-muted-foreground">
                {formatPercent(
                  entry.effectiveBalance > 0
                    ? entry.paidThisCycle / entry.effectiveBalance
                    : entry.paidThisCycle > 0
                      ? 1
                      : 0,
                )}{" "}
                paid
              </span>
            </div>
            <Progress value={entry.fullPayProgress} className="h-2" />
          </div>
        </div>

        {entry.availableCredit !== null && (
          <p className="text-xs text-muted-foreground">
            {formatCurrency(entry.availableCredit)} available ·{" "}
            {formatPercent(entry.utilization)} utilized
          </p>
        )}
      </CardContent>
    </Card>
  );
}
