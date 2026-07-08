import type {
  CreditCardPayment,
  EnrichedCreditCard,
  PaySuggestion,
} from "@/types/finance";
import {
  filterActivePayableCards,
  getDaysUntilDue,
  isDueSoon,
  isHighUtilization,
} from "@/lib/finance/calculations";

function buildPayable(
  enriched: EnrichedCreditCard[],
): Array<EnrichedCreditCard & { effectiveBalance: number }> {
  return enriched
    .filter((e) => e.card.card_status !== "closed" && e.effectiveBalance > 0)
    .map((e) => ({ ...e, effectiveBalance: e.effectiveBalance }));
}

export function getNextPaySuggestion(
  enriched: EnrichedCreditCard[],
): PaySuggestion | null {
  const payable = buildPayable(enriched);
  if (payable.length === 0) return null;

  const scored = payable.map((entry) => {
    let priority = 0;
    const days = getDaysUntilDue(entry.card.due_date);
    const minDue = entry.remainingMinimum;

    if (days !== null && days < 0) priority += 1000;
    else if (isDueSoon(entry.card.due_date)) priority += 500 - (days ?? 0) * 10;
    if (entry.utilization !== null && entry.utilization > 0.9) priority += 200;
    else if (isHighUtilization(entry.utilization)) priority += 100;
    if (!entry.minimumMet && minDue > 0) priority += 150;

    return { entry, priority, amount: minDue > 0 ? minDue : entry.effectiveBalance };
  });

  scored.sort((a, b) => b.priority - a.priority);
  const top = scored[0];
  if (!top) return null;

  const days = getDaysUntilDue(top.entry.card.due_date);
  let reason = "Highest priority based on due date and utilization";
  if (days !== null && days < 0) reason = "Overdue — pay minimum or more";
  else if (isDueSoon(top.entry.card.due_date))
    reason = `Due in ${days} day${days === 1 ? "" : "s"}`;
  else if (!top.entry.minimumMet)
    reason = "Minimum payment not yet met this cycle";

  return {
    cardId: top.entry.card.id,
    cardName: top.entry.card.card_name,
    reason,
    amount: top.amount,
    priority: top.priority,
  };
}

export function getAvalancheOrder(enriched: EnrichedCreditCard[]): PaySuggestion[] {
  const payable = filterActivePayableCards(
    enriched.map((e) => ({ card: e.card, effectiveBalance: e.effectiveBalance })),
  );

  return payable
    .map(({ card, effectiveBalance }) => ({
      card,
      effectiveBalance,
      apr: card.apr ?? 0,
    }))
    .sort((a, b) => b.apr - a.apr || b.effectiveBalance - a.effectiveBalance)
    .map(({ card, effectiveBalance, apr }, index) => ({
      cardId: card.id,
      cardName: card.card_name,
      reason:
        apr > 0
          ? `Highest APR (${apr.toFixed(2)}%)`
          : "No APR set — pay by balance",
      amount: card.minimum_payment ?? effectiveBalance,
      priority: 100 - index,
    }));
}

export function getSnowballOrder(enriched: EnrichedCreditCard[]): PaySuggestion[] {
  const payable = filterActivePayableCards(
    enriched.map((e) => ({ card: e.card, effectiveBalance: e.effectiveBalance })),
  );

  return payable
    .map(({ card, effectiveBalance }) => ({ card, effectiveBalance }))
    .sort((a, b) => a.effectiveBalance - b.effectiveBalance)
    .map(({ card, effectiveBalance }, index) => ({
      cardId: card.id,
      cardName: card.card_name,
      reason: "Smallest balance — snowball method",
      amount: card.minimum_payment ?? effectiveBalance,
      priority: 100 - index,
    }));
}

export function getAvalancheTopPick(
  enriched: EnrichedCreditCard[],
): PaySuggestion | null {
  return getAvalancheOrder(enriched)[0] ?? null;
}

export function getSnowballTopPick(
  enriched: EnrichedCreditCard[],
): PaySuggestion | null {
  return getSnowballOrder(enriched)[0] ?? null;
}

export function sortEnrichedByDueDate(
  enriched: EnrichedCreditCard[],
): EnrichedCreditCard[] {
  return [...enriched].sort((a, b) => {
    if (!a.card.due_date && !b.card.due_date) return 0;
    if (!a.card.due_date) return 1;
    if (!b.card.due_date) return -1;
    return a.card.due_date.localeCompare(b.card.due_date);
  });
}

export function buildBalanceHistory(
  openingBalance: number,
  payments: CreditCardPayment[],
  creditLimit: number | null,
  days = 90,
): import("@/types/finance").BalanceChartPoint[] {
  const completed = payments
    .filter((p) => p.status === "completed")
    .sort((a, b) => a.payment_date.localeCompare(b.payment_date));

  const points: import("@/types/finance").BalanceChartPoint[] = [];
  let runningPaid = 0;

  const firstDate =
    completed[0]?.payment_date ??
    new Date().toISOString().slice(0, 10);

  points.push({
    date: firstDate,
    balance: openingBalance,
    utilization:
      creditLimit && creditLimit > 0 ? openingBalance / creditLimit : null,
  });

  for (const payment of completed) {
    runningPaid += Number(payment.amount);
    const balance = Math.max(0, openingBalance - runningPaid);
    points.push({
      date: payment.payment_date,
      balance,
      utilization:
        creditLimit && creditLimit > 0 ? balance / creditLimit : null,
    });
  }

  return points.slice(-days);
}
