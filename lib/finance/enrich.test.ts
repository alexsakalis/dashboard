import { describe, expect, it } from "vitest";
import { buildPortfolioSummary, enrichCreditCards } from "./enrich";
import type { CreditCard, CreditCardPayment } from "@/types/finance";

const referenceDate = new Date("2026-08-15T12:00:00Z");

function makeCard(overrides: Partial<CreditCard>): CreditCard {
  return {
    id: "card",
    user_id: "user",
    card_name: "Card",
    provider: null,
    last_four: null,
    opening_balance: 500,
    credit_limit: 1000,
    apr: null,
    statement_day: null,
    minimum_payment: 50,
    due_date: null,
    card_status: "active",
    notes: null,
    tags: [],
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
    ...overrides,
  };
}

function makePayment(overrides: Partial<CreditCardPayment>): CreditCardPayment {
  return {
    id: "payment",
    user_id: "user",
    card_id: "card",
    amount: 50,
    payment_date: "2026-08-05",
    note: null,
    payment_method: null,
    status: "completed",
    created_at: "2026-08-05T00:00:00Z",
    updated_at: "2026-08-05T00:00:00Z",
    ...overrides,
  };
}

describe("buildPortfolioSummary", () => {
  it("does not apply one card's overpayment to another card's minimum", () => {
    const cardA = makeCard({
      id: "card-a",
      card_name: "Overpaid",
      minimum_payment: 50,
    });
    const cardB = makeCard({
      id: "card-b",
      card_name: "Unpaid",
      minimum_payment: 100,
    });
    const paymentsByCard = new Map<string, CreditCardPayment[]>([
      [
        cardA.id,
        [
          makePayment({
            id: "payment-a",
            card_id: cardA.id,
            amount: 250,
          }),
        ],
      ],
    ]);

    const enriched = enrichCreditCards(
      [cardA, cardB],
      paymentsByCard,
      referenceDate,
    );
    const summary = buildPortfolioSummary(enriched);

    expect(summary.totalMinimumDue).toBe(150);
    expect(summary.paidThisMonth).toBe(250);
    expect(summary.remainingDueThisMonth).toBe(100);
  });
});
