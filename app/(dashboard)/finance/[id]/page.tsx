import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  getBalanceSnapshots,
  getEnrichedCreditCard,
} from "@/lib/actions/finance";
import { buildBalanceHistory } from "@/lib/finance/suggestions";
import { EditCreditCardDialog } from "@/components/finance/EditCreditCardDialog";
import { AddPaymentDialog } from "@/components/finance/AddPaymentDialog";
import { PaymentCycleProgress } from "@/components/finance/PaymentCycleProgress";
import { PaymentHistoryList } from "@/components/finance/PaymentHistoryList";
import { BalanceSparkline } from "@/components/finance/BalanceSparkline";
import { DeleteCreditCardButton } from "@/components/finance/DeleteCreditCardButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/dashboard/CardSkeleton";
import {
  formatApr,
  formatCurrency,
  getCardStatusLabel,
  getCardStatusVariant,
} from "@/lib/finance/format";

async function CardDetail({ id }: { id: string }) {
  const entry = await getEnrichedCreditCard(id);
  if (!entry) notFound();

  const snapshots = await getBalanceSnapshots(id);
  const chartPoints =
    snapshots.length >= 2
      ? snapshots.map((s) => ({
          date: s.snapshot_date,
          balance: Number(s.balance),
          utilization:
            s.credit_limit && s.credit_limit > 0
              ? Number(s.balance) / Number(s.credit_limit)
              : null,
        }))
      : buildBalanceHistory(
          entry.card.opening_balance,
          entry.payments,
          entry.card.credit_limit,
        );

  const isClosed = entry.card.card_status === "closed";
  const subtitle = [
    entry.card.provider,
    entry.card.last_four ? `•••• ${entry.card.last_four}` : null,
    entry.card.apr != null ? formatApr(entry.card.apr) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="px-4 pt-2">
        <Link
          href="/finance"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          All cards
        </Link>
      </div>

      <PageHeader
        title={entry.card.card_name}
        subtitle={subtitle || undefined}
        action={
          <div className="flex items-center gap-1">
            <EditCreditCardDialog entry={entry} />
            <DeleteCreditCardButton cardId={entry.card.id} />
          </div>
        }
      />

      <main className="space-y-4 px-4 py-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant={getCardStatusVariant(entry.card.card_status)}>
            {getCardStatusLabel(entry.card.card_status)}
          </Badge>
          {entry.isOverdue && (
            <Badge variant="destructive">Overdue</Badge>
          )}
          {entry.isDueSoon && !entry.isOverdue && (
            <Badge variant="outline">Due soon</Badge>
          )}
          {entry.minimumMet && entry.effectiveBalance > 0 && (
            <Badge variant="secondary">Minimum met</Badge>
          )}
        </div>

        <PaymentCycleProgress entry={entry} />

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <BalanceSparkline points={chartPoints} title="Balance trend" />
          <BalanceSparkline
            points={chartPoints}
            title="Utilization trend"
            variant="utilization"
          />
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold">Payments</CardTitle>
            <AddPaymentDialog cardId={entry.card.id} disabled={isClosed} />
          </CardHeader>
          <CardContent>
            <PaymentHistoryList
              payments={entry.payments}
              readOnly={isClosed}
            />
          </CardContent>
        </Card>

        {(entry.card.notes || entry.card.tags.length > 0) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {entry.card.notes && (
                <p className="text-sm text-muted-foreground">{entry.card.notes}</p>
              )}
              {entry.card.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {entry.card.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Credit limit</dt>
                <dd className="font-semibold tabular-nums">
                  {formatCurrency(entry.card.credit_limit)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Available</dt>
                <dd className="font-semibold tabular-nums">
                  {formatCurrency(entry.availableCredit)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Paid this month</dt>
                <dd className="font-semibold tabular-nums">
                  {formatCurrency(entry.paidThisMonth)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Statement day</dt>
                <dd className="font-semibold tabular-nums">
                  {entry.card.statement_day ?? "—"}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </main>
    </>
  );
}

export default async function CreditCardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<CardSkeleton />}>
      <CardDetail id={id} />
    </Suspense>
  );
}
