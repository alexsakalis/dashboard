import type {
  CreditCard,
  CreditCardPayment,
  EnrichedCreditCard,
  CreditCardPortfolioSummary,
} from "@/types/finance";
import {
  getAvailableCredit,
  getDaysUntilDue,
  getEffectiveBalance,
  getMinimumMet,
  getProgressPercent,
  getRemainingMinimum,
  getUtilization,
  isArchivedClosedCard,
  isDueSoon,
  isHighUtilization,
  isNearLimit,
  isOverdue,
  isPaidOff,
} from "@/lib/finance/calculations";
import {
  getBillingCycle,
  getPaidThisCycle,
  getPaidThisMonth,
} from "@/lib/finance/cycle";
import { sortEnrichedByDueDate } from "@/lib/finance/suggestions";

export function enrichCreditCard(
  card: CreditCard,
  payments: CreditCardPayment[],
  referenceDate = new Date(),
): EnrichedCreditCard {
  const effectiveBalance = getEffectiveBalance(card.opening_balance, payments);
  const hasOpenCreditLine = card.card_status !== "closed";
  const utilization = hasOpenCreditLine
    ? getUtilization(effectiveBalance, card.credit_limit)
    : null;
  const cycle = getBillingCycle(card, referenceDate);
  const paidThisCycle = getPaidThisCycle(payments, cycle);
  const paidThisMonth = getPaidThisMonth(payments, referenceDate);
  const minimumPayment = card.minimum_payment;
  const minimumMet = getMinimumMet(paidThisCycle, minimumPayment);
  const remainingMinimum = getRemainingMinimum(paidThisCycle, minimumPayment);

  return {
    card,
    payments,
    effectiveBalance,
    availableCredit: hasOpenCreditLine
      ? getAvailableCredit(effectiveBalance, card.credit_limit)
      : null,
    utilization,
    daysUntilDue: getDaysUntilDue(card.due_date, referenceDate),
    isDueSoon: isDueSoon(card.due_date, referenceDate),
    isOverdue: isOverdue(card.due_date, effectiveBalance, referenceDate),
    isHighUtilization: isHighUtilization(utilization),
    isNearLimit: isNearLimit(utilization),
    isPaidOff: isPaidOff(effectiveBalance, card.card_status),
    paidThisCycle,
    paidThisMonth,
    minimumMet,
    remainingMinimum,
    fullPayProgress: getProgressPercent(paidThisCycle, effectiveBalance),
    minimumPayProgress: getProgressPercent(
      paidThisCycle,
      minimumPayment ?? 0,
    ),
  };
}

export function enrichCreditCards(
  cards: CreditCard[],
  paymentsByCard: Map<string, CreditCardPayment[]>,
  referenceDate = new Date(),
): EnrichedCreditCard[] {
  return sortEnrichedByDueDate(
    cards.map((card) =>
      enrichCreditCard(
        card,
        paymentsByCard.get(card.id) ?? [],
        referenceDate,
      ),
    ),
  );
}

export function buildPortfolioSummary(
  enriched: EnrichedCreditCard[],
): CreditCardPortfolioSummary {
  let totalDebt = 0;
  let totalLimits = 0;
  let totalAvailableCredit = 0;
  let totalMinimumDue = 0;
  let paidThisMonth = 0;
  let dueSoonCount = 0;
  let highUtilizationCount = 0;
  let nearLimitCount = 0;
  let utilizationDebt = 0;

  for (const entry of enriched) {
    if (isArchivedClosedCard(entry.card.card_status, entry.effectiveBalance)) {
      continue;
    }

    totalDebt += entry.effectiveBalance;
    paidThisMonth += entry.paidThisMonth;

    const hasOpenCreditLine = entry.card.card_status !== "closed";
    if (hasOpenCreditLine && entry.card.credit_limit) {
      totalLimits += entry.card.credit_limit;
      totalAvailableCredit += entry.availableCredit ?? 0;
      utilizationDebt += entry.effectiveBalance;
    }

    if (entry.card.card_status !== "paid_off" && entry.effectiveBalance > 0) {
      totalMinimumDue += Number(entry.card.minimum_payment ?? 0);
    }

    if (entry.effectiveBalance > 0 && entry.isDueSoon) dueSoonCount += 1;
    if (hasOpenCreditLine && entry.isHighUtilization) highUtilizationCount += 1;
    if (hasOpenCreditLine && entry.isNearLimit) nearLimitCount += 1;
  }

  const overallUtilization =
    totalLimits > 0 ? Math.min(1, utilizationDebt / totalLimits) : null;

  const remainingDueThisMonth = Math.max(0, totalMinimumDue - paidThisMonth);

  return {
    totalDebt,
    totalLimits,
    totalAvailableCredit,
    overallUtilization,
    totalMinimumDue,
    paidThisMonth,
    remainingDueThisMonth,
    cardCount: enriched.filter(
      (e) => !isArchivedClosedCard(e.card.card_status, e.effectiveBalance),
    ).length,
    dueSoonCount,
    highUtilizationCount,
    nearLimitCount,
    cards: enriched,
  };
}

export function toLegacySummary(
  portfolio: CreditCardPortfolioSummary,
): import("@/types/finance").CreditCardSummary {
  return {
    totalOwed: portfolio.totalDebt,
    totalMinimum: portfolio.totalMinimumDue,
    cardCount: portfolio.cardCount,
    dueSoonCount: portfolio.dueSoonCount,
    overallUtilization: portfolio.overallUtilization,
    paidThisMonth: portfolio.paidThisMonth,
  };
}
