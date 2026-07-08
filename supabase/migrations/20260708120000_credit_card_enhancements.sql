-- Credit card tracker v2: payments ledger, enriched card fields, snapshots, preferences

-- Extend credit_cards with new columns (keep legacy columns until app is updated)
ALTER TABLE credit_cards
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS last_four text,
  ADD COLUMN IF NOT EXISTS opening_balance numeric(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credit_limit numeric(12,2),
  ADD COLUMN IF NOT EXISTS apr numeric(5,2),
  ADD COLUMN IF NOT EXISTS statement_day int,
  ADD COLUMN IF NOT EXISTS card_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Migrate existing data from legacy columns
UPDATE credit_cards SET
  opening_balance = COALESCE(amount, opening_balance, 0),
  credit_limit = COALESCE(balance, credit_limit),
  card_status = CASE
    WHEN lower(trim(COALESCE(status, ''))) IN ('paid', 'paid off') THEN 'paid_off'
    WHEN lower(trim(COALESCE(status, ''))) = 'closed' THEN 'closed'
    ELSE 'active'
  END
WHERE amount IS NOT NULL OR balance IS NOT NULL OR status IS NOT NULL;

-- Constraints (added after backfill)
ALTER TABLE credit_cards
  DROP CONSTRAINT IF EXISTS credit_cards_last_four_check,
  ADD CONSTRAINT credit_cards_last_four_check
    CHECK (last_four IS NULL OR last_four ~ '^\d{4}$');

ALTER TABLE credit_cards
  DROP CONSTRAINT IF EXISTS credit_cards_statement_day_check,
  ADD CONSTRAINT credit_cards_statement_day_check
    CHECK (statement_day IS NULL OR (statement_day >= 1 AND statement_day <= 28));

ALTER TABLE credit_cards
  DROP CONSTRAINT IF EXISTS credit_cards_card_status_check,
  ADD CONSTRAINT credit_cards_card_status_check
    CHECK (card_status IN ('active', 'paid_off', 'closed'));

-- Payments ledger
CREATE TABLE IF NOT EXISTS credit_card_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  payment_date date NOT NULL,
  note text,
  payment_method text CHECK (payment_method IN ('checking', 'savings', 'debit', 'cash', 'other')),
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_credit_card_payments_card_date
  ON credit_card_payments(card_id, payment_date DESC);

CREATE INDEX IF NOT EXISTS idx_credit_card_payments_user_date
  ON credit_card_payments(user_id, payment_date DESC);

ALTER TABLE credit_card_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_card_payments_select ON credit_card_payments;
DROP POLICY IF EXISTS credit_card_payments_insert ON credit_card_payments;
DROP POLICY IF EXISTS credit_card_payments_update ON credit_card_payments;
DROP POLICY IF EXISTS credit_card_payments_delete ON credit_card_payments;

CREATE POLICY credit_card_payments_select ON credit_card_payments
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY credit_card_payments_insert ON credit_card_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY credit_card_payments_update ON credit_card_payments
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY credit_card_payments_delete ON credit_card_payments
  FOR DELETE USING (auth.uid() = user_id);

-- Balance snapshots for charts
CREATE TABLE IF NOT EXISTS credit_card_balance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_id uuid NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  balance numeric(12,2) NOT NULL,
  credit_limit numeric(12,2),
  UNIQUE(card_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_credit_card_snapshots_card_date
  ON credit_card_balance_snapshots(card_id, snapshot_date DESC);

ALTER TABLE credit_card_balance_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_card_balance_snapshots_select ON credit_card_balance_snapshots;
DROP POLICY IF EXISTS credit_card_balance_snapshots_insert ON credit_card_balance_snapshots;
DROP POLICY IF EXISTS credit_card_balance_snapshots_update ON credit_card_balance_snapshots;
DROP POLICY IF EXISTS credit_card_balance_snapshots_delete ON credit_card_balance_snapshots;

CREATE POLICY credit_card_balance_snapshots_select ON credit_card_balance_snapshots
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY credit_card_balance_snapshots_insert ON credit_card_balance_snapshots
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY credit_card_balance_snapshots_update ON credit_card_balance_snapshots
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY credit_card_balance_snapshots_delete ON credit_card_balance_snapshots
  FOR DELETE USING (auth.uid() = user_id);

-- User finance preferences
CREATE TABLE IF NOT EXISTS finance_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_payment_goal numeric(12,2),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE finance_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS finance_preferences_select ON finance_preferences;
DROP POLICY IF EXISTS finance_preferences_insert ON finance_preferences;
DROP POLICY IF EXISTS finance_preferences_update ON finance_preferences;
DROP POLICY IF EXISTS finance_preferences_delete ON finance_preferences;

CREATE POLICY finance_preferences_select ON finance_preferences
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY finance_preferences_insert ON finance_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY finance_preferences_update ON finance_preferences
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY finance_preferences_delete ON finance_preferences
  FOR DELETE USING (auth.uid() = user_id);
