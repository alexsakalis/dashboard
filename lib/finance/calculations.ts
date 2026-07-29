import { differenceInCalendarDays, parseISO, startOfDay } from "date-fns";
import type { CreditCard, CreditCardPayment } from "@/types/finance";

export const DUE_SOON_DAYS = 7;
export const HIGH_UTILIZATION_THRESHOLD = 0.3;
export const NEAR_LIMIT_THRESHOLD = 0.9;

export function sumCompletedPayments(payments: CreditCardPayment[]): number {
  return payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + Number(p.amount), 0);
}

export function getEffectiveBalance(
  openingBalance: number,
  payments: CreditCardPayment[],
): number {
  const paid = sumCompletedPayments(payments);
  return Math.max(0, Number(openingBalance) - paid);
}

export interface BalanceSnapshotDraft {
  snapshot_date: string;
  balance: number;
  credit_limit: number | null;
}

export function buildBalanceSnapshotDrafts(
  card: Pick<CreditCard, "opening_balance" | "credit_limit">,
  payments: CreditCardPayment[],
  today: string,
): BalanceSnapshotDraft[] {
  const snapshots = new Map<string, BalanceSnapshotDraft>();

  snapshots.set(today, {
    snapshot_date: today,
    balance: getEffectiveBalance(card.opening_balance, payments),
    credit_limit: card.credit_limit,
  });

  const completedByDate = new Map<string, number>();
  for (const payment of payments) {
    if (payment.status !== "completed") continue;
    completedByDate.set(
      payment.payment_date,
      (completedByDate.get(payment.payment_date) ?? 0) + Number(payment.amount),
    );
  }

  let paidThroughDate = 0;
  for (const [paymentDate, amount] of [...completedByDate.entries()].sort(
    ([a], [b]) => a.localeCompare(b),
  )) {
    paidThroughDate += amount;
    snapshots.set(paymentDate, {
      snapshot_date: paymentDate,
      balance: Math.max(0, Number(card.opening_balance) - paidThroughDate),
      credit_limit: card.credit_limit,
    });
  }

  return [...snapshots.values()].sort((a, b) =>
    a.snapshot_date.localeCompare(b.snapshot_date),
  );
}

export function getAvailableCredit(
  effectiveBalance: number,
  creditLimit: number | null,
): number | null {
  if (creditLimit === null || creditLimit === undefined) return null;
  return Math.max(0, Number(creditLimit) - effectiveBalance);
}

export function getUtilization(
  effectiveBalance: number,
  creditLimit: number | null,
): number | null {
  if (!creditLimit || creditLimit <= 0) return null;
  return Math.min(1, effectiveBalance / creditLimit);
}

export function getDaysUntilDue(dueDate: string | null, today = new Date()): number | null {
  if (!dueDate) return null;
  return differenceInCalendarDays(parseISO(dueDate), startOfDay(today));
}

export function isDueSoon(dueDate: string | null, today = new Date()): boolean {
  const days = getDaysUntilDue(dueDate, today);
  return days !== null && days >= 0 && days <= DUE_SOON_DAYS;
}

export function isOverdue(
  dueDate: string | null,
  effectiveBalance: number,
  today = new Date(),
): boolean {
  if (effectiveBalance <= 0 || !dueDate) return false;
  const days = getDaysUntilDue(dueDate, today);
  return days !== null && days < 0;
}

export function isHighUtilization(utilization: number | null): boolean {
  return utilization !== null && utilization > HIGH_UTILIZATION_THRESHOLD;
}

export function isNearLimit(utilization: number | null): boolean {
  return utilization !== null && utilization >= NEAR_LIMIT_THRESHOLD;
}

export function isPaidOff(
  effectiveBalance: number,
  cardStatus: CreditCard["card_status"],
): boolean {
  return effectiveBalance <= 0 || cardStatus === "paid_off";
}

export function getMinimumMet(
  paidThisCycle: number,
  minimumPayment: number | null,
): boolean {
  if (!minimumPayment || minimumPayment <= 0) return effectiveBalanceMet(paidThisCycle);
  return paidThisCycle >= minimumPayment;
}

function effectiveBalanceMet(paid: number): boolean {
  return paid > 0;
}

export function getRemainingMinimum(
  paidThisCycle: number,
  minimumPayment: number | null,
): number {
  if (!minimumPayment || minimumPayment <= 0) return 0;
  return Math.max(0, minimumPayment - paidThisCycle);
}

export function getProgressPercent(paid: number, target: number): number {
  if (target <= 0) return paid > 0 ? 100 : 0;
  return Math.min(100, (paid / target) * 100);
}

export function computeOpeningBalanceForTarget(
  desiredEffectiveBalance: number,
  payments: CreditCardPayment[],
): number {
  return desiredEffectiveBalance + sumCompletedPayments(payments);
}

export function sumPaymentsInRange(
  payments: CreditCardPayment[],
  start: Date,
  end: Date,
): number {
  const startMs = startOfDay(start).getTime();
  const endMs = startOfDay(end).getTime();

  return payments
    .filter((p) => p.status === "completed")
    .filter((p) => {
      const d = startOfDay(parseISO(p.payment_date)).getTime();
      return d >= startMs && d <= endMs;
    })
    .reduce((sum, p) => sum + Number(p.amount), 0);
}

export function filterActivePayableCards(
  cards: Array<{ card: CreditCard; effectiveBalance: number }>,
): Array<{ card: CreditCard; effectiveBalance: number }> {
  return cards.filter(
    ({ card, effectiveBalance }) =>
      card.card_status !== "closed" && effectiveBalance > 0,
  );
}
