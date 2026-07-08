import { z } from "zod";

export const cardStatusSchema = z.enum(["active", "paid_off", "closed"]);
export const paymentStatusSchema = z.enum(["pending", "completed"]);
export const paymentMethodSchema = z.enum([
  "checking",
  "savings",
  "debit",
  "cash",
  "other",
]);

const optionalNumber = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((val) => {
    if (val === null || val === undefined || String(val).trim() === "")
      return null;
    const n = Number.parseFloat(String(val));
    if (!Number.isFinite(n)) throw new Error("Invalid number");
    return n;
  });

const requiredNonNegative = optionalNumber.refine(
  (n) => n !== null && n >= 0,
  "Must be zero or greater",
);

const requiredPositive = optionalNumber.refine(
  (n) => n !== null && n > 0,
  "Must be greater than zero",
);

export const creditCardFormSchema = z.object({
  card_name: z.string().trim().min(1, "Card name is required"),
  provider: z.string().trim().optional().nullable(),
  last_four: z
    .string()
    .trim()
    .optional()
    .nullable()
    .refine(
      (v) => !v || /^\d{4}$/.test(v),
      "Last four must be exactly 4 digits",
    ),
  opening_balance: requiredNonNegative,
  credit_limit: optionalNumber.refine(
    (n) => n === null || n >= 0,
    "Credit limit must be zero or greater",
  ),
  apr: optionalNumber.refine(
    (n) => n === null || (n >= 0 && n <= 100),
    "APR must be between 0 and 100",
  ),
  statement_day: optionalNumber.refine(
    (n) => n === null || (Number.isInteger(n) && n >= 1 && n <= 28),
    "Statement day must be 1–28",
  ),
  minimum_payment: optionalNumber.refine(
    (n) => n === null || n >= 0,
    "Minimum payment must be zero or greater",
  ),
  due_date: z.string().optional().nullable(),
  card_status: cardStatusSchema.default("active"),
  notes: z.string().trim().optional().nullable(),
  tags: z.string().trim().optional().nullable(),
});

export const creditCardUpdateSchema = creditCardFormSchema.extend({
  effective_balance: optionalNumber.refine(
    (n) => n === null || n >= 0,
    "Balance must be zero or greater",
  ),
});

export const paymentFormSchema = z.object({
  card_id: z.string().uuid(),
  amount: requiredPositive,
  payment_date: z.string().min(1, "Payment date is required"),
  note: z.string().trim().optional().nullable(),
  payment_method: paymentMethodSchema.optional().nullable(),
  status: paymentStatusSchema.default("completed"),
});

export const monthlyGoalSchema = z.object({
  monthly_payment_goal: optionalNumber.refine(
    (n) => n === null || n >= 0,
    "Goal must be zero or greater",
  ),
});

export function parseTagsInput(raw: string | null | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function validatePaymentDateNotFuture(dateStr: string): void {
  const paymentDate = new Date(`${dateStr}T12:00:00`);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  if (paymentDate >= tomorrow) {
    throw new Error("Payment date cannot be in the future");
  }
}
