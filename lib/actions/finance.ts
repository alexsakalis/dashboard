"use server";

import { revalidatePath } from "next/cache";
import { format } from "date-fns";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { filterCreditCards, isSummaryCardName } from "@/lib/finance/cards";
import {
  buildPortfolioSummary,
  enrichCreditCard,
  enrichCreditCards,
  toLegacySummary,
} from "@/lib/finance/enrich";
import { getEffectiveBalance, computeOpeningBalanceForTarget } from "@/lib/finance/calculations";
import {
  creditCardFormSchema,
  creditCardUpdateSchema,
  monthlyGoalSchema,
  parseTagsInput,
  paymentFormSchema,
  validatePaymentDateNotFuture,
} from "@/lib/finance/validators";
import type {
  CreditCard,
  CreditCardBalanceSnapshot,
  CreditCardPayment,
  CreditCardPortfolioSummary,
  CreditCardSummary,
  FinancePreferences,
} from "@/types/finance";

function revalidateFinancePaths(cardId?: string) {
  revalidatePath("/finance");
  revalidatePath("/");
  if (cardId) revalidatePath(`/finance/${cardId}`);
}

async function upsertBalanceSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  cardId: string,
  snapshotDate: string,
  balance: number,
  creditLimit: number | null,
) {
  await supabase.from("credit_card_balance_snapshots").upsert(
    {
      user_id: userId,
      card_id: cardId,
      snapshot_date: snapshotDate,
      balance,
      credit_limit: creditLimit,
    },
    { onConflict: "card_id,snapshot_date" },
  );
}

async function syncCardSnapshots(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  card: CreditCard,
  payments: CreditCardPayment[],
) {
  const today = format(new Date(), "yyyy-MM-dd");
  const effectiveBalance = getEffectiveBalance(card.opening_balance, payments);
  await upsertBalanceSnapshot(
    supabase,
    userId,
    card.id,
    today,
    effectiveBalance,
    card.credit_limit,
  );

  for (const payment of payments.filter((p) => p.status === "completed")) {
    const paidBefore = payments
      .filter(
        (p) =>
          p.status === "completed" &&
          p.payment_date <= payment.payment_date &&
          p.id !== payment.id,
      )
      .reduce((s, p) => s + Number(p.amount), 0);
    const balanceAtPayment = Math.max(
      0,
      card.opening_balance - paidBefore - Number(payment.amount),
    );
    await upsertBalanceSnapshot(
      supabase,
      userId,
      card.id,
      payment.payment_date,
      balanceAtPayment,
      card.credit_limit,
    );
  }
}

function formDataToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value;
  }
  return obj;
}

function mapCreditCardRow(row: Record<string, unknown>): CreditCard {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    card_name: row.card_name as string,
    provider: (row.provider as string | null) ?? null,
    last_four: (row.last_four as string | null) ?? null,
    opening_balance: Number(row.opening_balance ?? row.amount ?? 0),
    credit_limit:
      row.credit_limit != null
        ? Number(row.credit_limit)
        : row.balance != null
          ? Number(row.balance)
          : null,
    apr: row.apr != null ? Number(row.apr) : null,
    statement_day:
      row.statement_day != null ? Number(row.statement_day) : null,
    minimum_payment:
      row.minimum_payment != null ? Number(row.minimum_payment) : null,
    due_date: (row.due_date as string | null) ?? null,
    card_status:
      (row.card_status as CreditCard["card_status"]) ??
      (row.status === "Paid" || row.status === "paid_off"
        ? "paid_off"
        : row.status === "closed"
          ? "closed"
          : "active"),
    notes: (row.notes as string | null) ?? null,
    tags: (row.tags as string[]) ?? [],
    created_at: (row.created_at as string) ?? row.updated_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getPaymentsByCardIds(
  cardIds: string[],
): Promise<Map<string, CreditCardPayment[]>> {
  if (cardIds.length === 0) return new Map();

  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("credit_card_payments")
    .select("*")
    .eq("user_id", user.id)
    .in("card_id", cardIds)
    .order("payment_date", { ascending: false });

  if (error) throw error;

  const map = new Map<string, CreditCardPayment[]>();
  for (const row of data ?? []) {
    const payment = row as CreditCardPayment;
    const list = map.get(payment.card_id) ?? [];
    list.push(payment);
    map.set(payment.card_id, list);
  }
  return map;
}

export async function getCreditCards(): Promise<CreditCard[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("user_id", user.id)
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return filterCreditCards(
    (data ?? []).map((row) => mapCreditCardRow(row as Record<string, unknown>)),
  );
}

export async function getCreditCardById(
  cardId: string,
): Promise<{ card: CreditCard; payments: CreditCardPayment[] } | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("credit_cards")
    .select("*")
    .eq("id", cardId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const card = mapCreditCardRow(data as Record<string, unknown>);
  const paymentsMap = await getPaymentsByCardIds([cardId]);
  return { card, payments: paymentsMap.get(cardId) ?? [] };
}

export async function getCreditCardPortfolio(): Promise<CreditCardPortfolioSummary> {
  const cards = await getCreditCards();
  const paymentsMap = await getPaymentsByCardIds(cards.map((c) => c.id));
  const enriched = enrichCreditCards(cards, paymentsMap);
  return buildPortfolioSummary(enriched);
}

export async function getCreditCardSummary(): Promise<CreditCardSummary> {
  const portfolio = await getCreditCardPortfolio();
  return toLegacySummary(portfolio);
}

export async function getBalanceSnapshots(
  cardId: string,
  limit = 90,
): Promise<CreditCardBalanceSnapshot[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("credit_card_balance_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .eq("card_id", cardId)
    .order("snapshot_date", { ascending: true })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as CreditCardBalanceSnapshot[];
}

export async function getFinancePreferences(): Promise<FinancePreferences | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("finance_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  return (data as FinancePreferences | null) ?? null;
}

export async function createCreditCard(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const raw = formDataToObject(formData);
  const parsed = creditCardFormSchema.parse(raw);

  if (isSummaryCardName(parsed.card_name)) {
    throw new Error("That name is reserved for totals, not a card.");
  }

  const { data, error } = await supabase
    .from("credit_cards")
    .insert({
      user_id: user.id,
      card_name: parsed.card_name,
      provider: parsed.provider || null,
      last_four: parsed.last_four || null,
      opening_balance: parsed.opening_balance ?? 0,
      credit_limit: parsed.credit_limit,
      apr: parsed.apr,
      statement_day: parsed.statement_day,
      minimum_payment: parsed.minimum_payment,
      due_date: parsed.due_date || null,
      card_status: parsed.card_status,
      notes: parsed.notes || null,
      tags: parseTagsInput(parsed.tags ?? null),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) throw error;

  const card = mapCreditCardRow(data as Record<string, unknown>);
  await upsertBalanceSnapshot(
    supabase,
    user.id,
    card.id,
    format(new Date(), "yyyy-MM-dd"),
    card.opening_balance,
    card.credit_limit,
  );

  revalidateFinancePaths();
}

export async function updateCreditCard(cardId: string, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const existing = await getCreditCardById(cardId);
  if (!existing) throw new Error("Card not found");

  const raw = formDataToObject(formData);
  const parsed = creditCardUpdateSchema.parse(raw);

  let openingBalance = parsed.opening_balance ?? existing.card.opening_balance;

  if (
    parsed.effective_balance !== null &&
    parsed.effective_balance !== undefined
  ) {
    openingBalance = computeOpeningBalanceForTarget(
      parsed.effective_balance,
      existing.payments,
    );
  }

  const { data, error } = await supabase
    .from("credit_cards")
    .update({
      card_name: parsed.card_name,
      provider: parsed.provider || null,
      last_four: parsed.last_four || null,
      opening_balance: openingBalance,
      credit_limit: parsed.credit_limit,
      apr: parsed.apr,
      statement_day: parsed.statement_day,
      minimum_payment: parsed.minimum_payment,
      due_date: parsed.due_date || null,
      card_status: parsed.card_status,
      notes: parsed.notes || null,
      tags: parseTagsInput(parsed.tags ?? null),
      updated_at: new Date().toISOString(),
    })
    .eq("id", cardId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) throw error;

  const card = mapCreditCardRow(data as Record<string, unknown>);
  await syncCardSnapshots(supabase, user.id, card, existing.payments);
  revalidateFinancePaths(cardId);
}

export async function deleteCreditCard(cardId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { error } = await supabase
    .from("credit_cards")
    .delete()
    .eq("id", cardId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidateFinancePaths();
}

export async function createPayment(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = paymentFormSchema.parse(formDataToObject(formData));
  validatePaymentDateNotFuture(parsed.payment_date);

  const existing = await getCreditCardById(parsed.card_id);
  if (!existing) throw new Error("Card not found");
  if (existing.card.card_status === "closed") {
    throw new Error("Cannot add payments to a closed card");
  }

  const { error } = await supabase.from("credit_card_payments").insert({
    user_id: user.id,
    card_id: parsed.card_id,
    amount: parsed.amount,
    payment_date: parsed.payment_date,
    note: parsed.note || null,
    payment_method: parsed.payment_method || null,
    status: parsed.status,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;

  const refreshed = await getCreditCardById(parsed.card_id);
  if (refreshed) {
    await syncCardSnapshots(supabase, user.id, refreshed.card, refreshed.payments);
  }

  revalidateFinancePaths(parsed.card_id);
}

export async function updatePayment(paymentId: string, formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: paymentRow, error: fetchError } = await supabase
    .from("credit_card_payments")
    .select("*")
    .eq("id", paymentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!paymentRow) throw new Error("Payment not found");

  const parsed = paymentFormSchema.parse({
    ...formDataToObject(formData),
    card_id: paymentRow.card_id,
  });
  validatePaymentDateNotFuture(parsed.payment_date);

  const { error } = await supabase
    .from("credit_card_payments")
    .update({
      amount: parsed.amount,
      payment_date: parsed.payment_date,
      note: parsed.note || null,
      payment_method: parsed.payment_method || null,
      status: parsed.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("user_id", user.id);

  if (error) throw error;

  const refreshed = await getCreditCardById(paymentRow.card_id as string);
  if (refreshed) {
    await syncCardSnapshots(supabase, user.id, refreshed.card, refreshed.payments);
  }

  revalidateFinancePaths(paymentRow.card_id as string);
}

export async function deletePayment(paymentId: string) {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: paymentRow, error: fetchError } = await supabase
    .from("credit_card_payments")
    .select("card_id")
    .eq("id", paymentId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!paymentRow) throw new Error("Payment not found");

  const cardId = paymentRow.card_id as string;

  const { error } = await supabase
    .from("credit_card_payments")
    .delete()
    .eq("id", paymentId)
    .eq("user_id", user.id);

  if (error) throw error;

  const refreshed = await getCreditCardById(cardId);
  if (refreshed) {
    await syncCardSnapshots(supabase, user.id, refreshed.card, refreshed.payments);
  }

  revalidateFinancePaths(cardId);
}

export async function updateMonthlyPaymentGoal(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const parsed = monthlyGoalSchema.parse(formDataToObject(formData));

  const { error } = await supabase.from("finance_preferences").upsert(
    {
      user_id: user.id,
      monthly_payment_goal: parsed.monthly_payment_goal,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) throw error;
  revalidateFinancePaths();
}

export async function getEnrichedCreditCard(cardId: string) {
  const result = await getCreditCardById(cardId);
  if (!result) return null;
  return enrichCreditCard(result.card, result.payments);
}
