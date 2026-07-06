import { format } from "date-fns";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getFinanceEntries } from "@/lib/actions/dashboard";
import { CreateFinanceDialog } from "@/components/finance/CreateFinanceDialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

async function FinanceList() {
  const entries = await getFinanceEntries(50);

  if (entries.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No entries yet. Add one or connect Google Sheets in Settings.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {entries.map((entry) => (
        <Card key={entry.id}>
          <CardContent className="flex items-center justify-between p-4">
            <div className="min-w-0">
              <p className="truncate font-medium">
                {entry.merchant || entry.category || "Transaction"}
              </p>
              <p className="text-xs text-muted-foreground">
                {format(new Date(entry.date), "MMM d, yyyy")}
                {entry.category && ` · ${entry.category}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {entry.entry_type}
              </Badge>
              <p
                className={`font-semibold tabular-nums ${
                  entry.entry_type === "income"
                    ? "text-green-600"
                    : "text-foreground"
                }`}
              >
                {entry.entry_type === "expense" ? "-" : "+"}$
                {Math.abs(Number(entry.amount)).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function FinancePage() {
  return (
    <>
      <PageHeader title="Finance" action={<CreateFinanceDialog />} />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <FinanceList />
        </Suspense>
      </main>
    </>
  );
}
