import {
  endOfMonth,
  parseISO,
  setDate,
  startOfDay,
  startOfMonth,
  subDays,
} from "date-fns";
import type { CreditCard, CreditCardPayment } from "@/types/finance";
import { sumPaymentsInRange } from "@/lib/finance/calculations";

export interface BillingCycle {
  start: Date;
  end: Date;
}

export function getBillingCycle(
  card: Pick<CreditCard, "statement_day" | "due_date">,
  referenceDate = new Date(),
): BillingCycle {
  const today = startOfDay(referenceDate);

  if (card.statement_day) {
    const day = Math.min(card.statement_day, 28);
    let cycleStart = setDate(today, day);
    if (cycleStart > today) {
      cycleStart = setDate(subDays(startOfMonth(today), 0), day);
      if (cycleStart > today) {
        const prevMonth = subDays(startOfMonth(today), 1);
        cycleStart = setDate(prevMonth, day);
      }
    }
    const nextCycleStart = setDate(subDays(startOfMonth(cycleStart), -1), day);
    const cycleEnd =
      nextCycleStart > cycleStart
        ? subDays(nextCycleStart, 1)
        : endOfMonth(cycleStart);
    return { start: cycleStart, end: cycleEnd };
  }

  return {
    start: startOfMonth(today),
    end: endOfMonth(today),
  };
}

export function getPaymentsInCycle(
  payments: CreditCardPayment[],
  cycle: BillingCycle,
): CreditCardPayment[] {
  const startMs = startOfDay(cycle.start).getTime();
  const endMs = startOfDay(cycle.end).getTime();

  return payments.filter((p) => {
    if (p.status !== "completed") return false;
    const d = startOfDay(parseISO(p.payment_date)).getTime();
    return d >= startMs && d <= endMs;
  });
}

export function getPaidThisCycle(
  payments: CreditCardPayment[],
  cycle: BillingCycle,
): number {
  return sumPaymentsInRange(payments, cycle.start, cycle.end);
}

export function getPaidThisMonth(
  payments: CreditCardPayment[],
  referenceDate = new Date(),
): number {
  const start = startOfMonth(referenceDate);
  const end = endOfMonth(referenceDate);
  return sumPaymentsInRange(payments, start, end);
}

export function getPaidThisMonthForCards(
  paymentsByCard: Map<string, CreditCardPayment[]>,
  referenceDate = new Date(),
): number {
  let total = 0;
  for (const payments of paymentsByCard.values()) {
    total += getPaidThisMonth(payments, referenceDate);
  }
  return total;
}
