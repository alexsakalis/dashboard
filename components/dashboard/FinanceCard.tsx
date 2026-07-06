import Link from "next/link";
import { ArrowRight, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFinanceSummary } from "@/lib/actions/dashboard";

export async function FinanceCard() {
  const summary = await getFinanceSummary();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Finance</CardTitle>
        <Link
          href="/finance"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          View <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-xs">Today</span>
            </div>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              ${summary.spentToday.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">spent</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              <span className="text-xs">This month</span>
            </div>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              ${summary.spentMonth.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">spent</p>
          </div>
        </div>
        {summary.incomeToday > 0 && (
          <p className="mt-3 text-xs text-green-600">
            +${summary.incomeToday.toFixed(2)} income today
          </p>
        )}
      </CardContent>
    </Card>
  );
}
