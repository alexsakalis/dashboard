import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCreditCardPortfolio, getFinancePreferences } from "@/lib/actions/finance";
import { AddCreditCardDialog } from "@/components/finance/AddCreditCardDialog";
import { CreditCardSummaryGrid } from "@/components/finance/CreditCardSummaryGrid";
import { CreditCardListItem } from "@/components/finance/CreditCardListItem";
import { PaySuggestionsPanel } from "@/components/finance/PaySuggestionsPanel";
import { MonthlyPaymentGoalCard } from "@/components/finance/MonthlyPaymentGoalCard";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";

async function FinanceDashboard() {
  const [portfolio, preferences] = await Promise.all([
    getCreditCardPortfolio(),
    getFinancePreferences(),
  ]);

  if (portfolio.cards.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No credit cards yet. Tap Add card to get started.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <CreditCardSummaryGrid portfolio={portfolio} />
      <PaySuggestionsPanel cards={portfolio.cards} />
      <MonthlyPaymentGoalCard
        goal={preferences?.monthly_payment_goal ?? null}
        paidThisMonth={portfolio.paidThisMonth}
      />
      <div className="space-y-2">
        <h2 className="section-label">Your cards</h2>
        {portfolio.cards.map((entry) => (
          <CreditCardListItem key={entry.card.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}

export default function FinancePage() {
  return (
    <>
      <PageHeader
        title="Credit Cards"
        subtitle="Track balances, payments, and due dates"
        action={<AddCreditCardDialog />}
      />
      <main className="px-4 py-4">
        <Suspense fallback={<CardSkeleton />}>
          <FinanceDashboard />
        </Suspense>
      </main>
    </>
  );
}
