import { Card, CardContent } from "@/components/ui/card";
import {
  formatCurrency,
  formatPercent,
} from "@/lib/finance/format";
import type { CreditCardPortfolioSummary } from "@/types/finance";

interface StatProps {
  label: string;
  value: string;
  hint?: string;
}

function StatCard({ label, value, hint }: StatProps) {
  return (
    <Card className="py-3">
      <CardContent className="px-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-lg font-semibold tabular-nums tracking-tight">
          {value}
        </p>
        {hint && (
          <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function CreditCardSummaryGrid({
  portfolio,
}: {
  portfolio: CreditCardPortfolioSummary;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard
        label="Total debt"
        value={formatCurrency(portfolio.totalDebt)}
        hint={`${portfolio.cardCount} card${portfolio.cardCount === 1 ? "" : "s"}`}
      />
      <StatCard
        label="Total limits"
        value={formatCurrency(portfolio.totalLimits || null)}
        hint={
          portfolio.totalLimits > 0
            ? `${formatCurrency(portfolio.totalAvailableCredit)} available`
            : undefined
        }
      />
      <StatCard
        label="Utilization"
        value={formatPercent(portfolio.overallUtilization)}
        hint={
          portfolio.highUtilizationCount > 0
            ? `${portfolio.highUtilizationCount} over 30%`
            : "All cards healthy"
        }
      />
      <StatCard
        label="Min. due"
        value={formatCurrency(portfolio.totalMinimumDue)}
        hint={
          portfolio.dueSoonCount > 0
            ? `${portfolio.dueSoonCount} due within 7 days`
            : "No urgent due dates"
        }
      />
      <StatCard
        label="Paid this month"
        value={formatCurrency(portfolio.paidThisMonth)}
        hint={
          portfolio.remainingDueThisMonth > 0
            ? `${formatCurrency(portfolio.remainingDueThisMonth)} remaining`
            : "Minimums covered"
        }
      />
    </div>
  );
}
