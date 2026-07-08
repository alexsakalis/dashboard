export type CardStatus = "active" | "paid_off" | "closed";
export type PaymentStatus = "pending" | "completed";
export type PaymentMethod =
  | "checking"
  | "savings"
  | "debit"
  | "cash"
  | "other";

export interface CreditCard {
  id: string;
  user_id: string;
  card_name: string;
  provider: string | null;
  last_four: string | null;
  opening_balance: number;
  credit_limit: number | null;
  apr: number | null;
  statement_day: number | null;
  minimum_payment: number | null;
  due_date: string | null;
  card_status: CardStatus;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface CreditCardPayment {
  id: string;
  user_id: string;
  card_id: string;
  amount: number;
  payment_date: string;
  note: string | null;
  payment_method: PaymentMethod | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}

export interface CreditCardBalanceSnapshot {
  id: string;
  user_id: string;
  card_id: string;
  snapshot_date: string;
  balance: number;
  credit_limit: number | null;
}

export interface FinancePreferences {
  user_id: string;
  monthly_payment_goal: number | null;
  updated_at: string;
}

export interface EnrichedCreditCard {
  card: CreditCard;
  payments: CreditCardPayment[];
  effectiveBalance: number;
  availableCredit: number | null;
  utilization: number | null;
  daysUntilDue: number | null;
  isDueSoon: boolean;
  isOverdue: boolean;
  isHighUtilization: boolean;
  isNearLimit: boolean;
  isPaidOff: boolean;
  paidThisCycle: number;
  paidThisMonth: number;
  minimumMet: boolean;
  remainingMinimum: number;
  fullPayProgress: number;
  minimumPayProgress: number;
}

export interface CreditCardPortfolioSummary {
  totalDebt: number;
  totalLimits: number;
  totalAvailableCredit: number;
  overallUtilization: number | null;
  totalMinimumDue: number;
  paidThisMonth: number;
  remainingDueThisMonth: number;
  cardCount: number;
  dueSoonCount: number;
  highUtilizationCount: number;
  nearLimitCount: number;
  cards: EnrichedCreditCard[];
}

export interface CreditCardSummary {
  totalOwed: number;
  totalMinimum: number;
  cardCount: number;
  dueSoonCount: number;
  overallUtilization: number | null;
  paidThisMonth: number;
}

export interface PaySuggestion {
  cardId: string;
  cardName: string;
  reason: string;
  amount: number;
  priority: number;
}

export interface BalanceChartPoint {
  date: string;
  balance: number;
  utilization: number | null;
}
