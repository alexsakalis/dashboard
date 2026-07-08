import Link from "next/link";
import { ArrowRight, CreditCard, CalendarClock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCreditCardSummary } from "@/lib/actions/finance";
import { formatCurrency, formatPercent } from "@/lib/finance/format";

export async function FinanceCard() {
  const summary = await getCreditCardSummary();
  const hasData = summary.cardCount > 0;

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
                {formatCurrency(summary.totalOwed)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.cardCount} card{summary.cardCount === 1 ? "" : "s"}
                {summary.overallUtilization != null &&
                  ` · ${formatPercent(summary.overallUtilization)} util`}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5" />
                <span className="text-xs">Minimum due</span>
              </div>
              <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight">
                {formatCurrency(summary.totalMinimum)}
              </p>
              <p className="text-xs text-muted-foreground">
                {summary.dueSoonCount > 0
                  ? `${summary.dueSoonCount} due within 7 days`
                  : "No payments due soon"}
              </p>
            </div>
            <div className="col-span-2 flex items-center gap-1.5 border-t border-border/50 pt-3 text-muted-foreground">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-xs">
                {formatCurrency(summary.paidThisMonth)} paid this month
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
