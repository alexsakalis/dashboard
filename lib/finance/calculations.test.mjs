import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeOpeningBalanceForTarget,
  hasEffectiveBalanceAdjustment,
} from "./calculations.ts";

function payment(amount, status = "completed") {
  return {
    id: crypto.randomUUID(),
    user_id: crypto.randomUUID(),
    card_id: crypto.randomUUID(),
    amount,
    payment_date: "2026-09-02",
    note: null,
    payment_method: null,
    status,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

describe("hasEffectiveBalanceAdjustment", () => {
  it("ignores the prefilled effective balance when it has not changed", () => {
    const payments = [payment(2000)];

    assert.equal(hasEffectiveBalanceAdjustment(3000, 5000, payments), false);
  });

  it("detects a submitted effective balance adjustment", () => {
    const payments = [payment(2000)];

    assert.equal(hasEffectiveBalanceAdjustment(3500, 5000, payments), true);
    assert.equal(computeOpeningBalanceForTarget(3500, payments), 5500);
  });

  it("ignores omitted effective balance fields", () => {
    const payments = [payment(2000)];

    assert.equal(hasEffectiveBalanceAdjustment(null, 5000, payments), false);
    assert.equal(hasEffectiveBalanceAdjustment(undefined, 5000, payments), false);
  });
});
