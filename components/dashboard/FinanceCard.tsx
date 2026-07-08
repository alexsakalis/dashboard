import Link from "next/link";
import { ArrowRight, CreditCard, CalendarClock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/finance/format";
import type { DashboardSummary } from "@/types";

export function FinanceCard({ summary }: { summary: DashboardSummary }) {
  const finance = summary.card_data.finance;
  const hasData = finance && finance.card_count > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Credit Cards</CardTitle>
        <Link
          href="/finance"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          View <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Add your credit cards to track what you owe.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                <span className="text-xs">Total owed</span>
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
                {formatCurrency(finance.total_owed)}
              </p>
              <p className="text-xs text-muted-foreground">
                {finance.card_count} card{finance.card_count === 1 ? "" : "s"}
                {finance.overall_utilization != null &&
                  ` · ${formatPercent(finance.overall_utilization)} util`}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                <span className="text-xs">Minimum due</span>
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
                {formatCurrency(finance.total_minimum)}
              </p>
              <p className="text-xs text-muted-foreground">
                {finance.due_soon_count > 0
                  ? `${finance.due_soon_count} due within 7 days`
                  : "No payments due soon"}
              </p>
            </div>
            <div className="col-span-2 flex items-center gap-1.5 border-t border-border/50 pt-3 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs">
                {formatCurrency(finance.paid_this_month)} paid this month
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
