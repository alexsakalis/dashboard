import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  formatCardLabel,
  formatCurrency,
  formatDueDateLabel,
  formatPercent,
  getCardStatusLabel,
  getCardStatusVariant,
} from "@/lib/finance/format";
import type { EnrichedCreditCard } from "@/types/finance";

export function CreditCardListItem({ entry }: { entry: EnrichedCreditCard }) {
  const dueLabel = formatDueDateLabel(entry.card.due_date);
  const utilPercent = entry.utilization != null ? entry.utilization * 100 : 0;

  return (
    <Link href={`/finance/${entry.card.id}`} className="block">
      <Card
        className={cn(
          "transition-colors hover:bg-muted/40 active:bg-muted/60",
          entry.isPaidOff && "opacity-75",
          entry.isOverdue && "border-destructive/40",
          entry.isDueSoon && !entry.isOverdue && "border-primary/30",
        )}
      >
        <CardContent className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {formatCardLabel(
                  entry.card.card_name,
                  entry.card.provider,
                  entry.card.last_four,
                )}
              </p>
              {dueLabel && (
                <p
                  className={cn(
                    "text-xs",
                    entry.isOverdue
                      ? "text-destructive"
                      : "text-muted-foreground",
                  )}
                >
                  {dueLabel}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {entry.isPaidOff && (
                <Badge variant="default" className="text-[10px]">
                  Paid off
                </Badge>
              )}
              {entry.isNearLimit && !entry.isPaidOff && (
                <Badge variant="destructive" className="text-[10px]">
                  Near limit
                </Badge>
              )}
              {entry.isHighUtilization && !entry.isNearLimit && !entry.isPaidOff && (
                <Badge variant="outline" className="text-[10px]">
                  High util
                </Badge>
              )}
              {entry.card.card_status !== "active" && !entry.isPaidOff && (
                <Badge
                  variant={getCardStatusVariant(entry.card.card_status)}
                  className="text-[10px]"
                >
                  {getCardStatusLabel(entry.card.card_status)}
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-lg font-semibold tabular-nums tracking-tight">
                {formatCurrency(entry.effectiveBalance)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Minimum</p>
              <p className="font-semibold tabular-nums">
                {formatCurrency(entry.card.minimum_payment)}
              </p>
            </div>
          </div>

          {entry.card.credit_limit != null && entry.card.credit_limit > 0 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Utilization</span>
                <span>{formatPercent(entry.utilization)}</span>
              </div>
              <Progress
                value={utilPercent}
                className={cn(
                  "h-1.5",
                  entry.isNearLimit && "[&_[data-slot=progress-indicator]]:bg-destructive",
                  entry.isHighUtilization &&
                    !entry.isNearLimit &&
                    "[&_[data-slot=progress-indicator]]:bg-amber-500",
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
