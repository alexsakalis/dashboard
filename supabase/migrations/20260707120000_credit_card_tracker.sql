-- Replace transaction-based finance with credit card tracker synced from Google Sheets

DROP TABLE IF EXISTS finance_entries;

CREATE TABLE IF NOT EXISTS credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_name text NOT NULL,
  amount numeric(12,2),
  minimum_payment numeric(12,2),
  due_date date,
  balance numeric(12,2),
  status text,
  snapshot_date date,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_name)
);

CREATE INDEX IF NOT EXISTS idx_credit_cards_user_due ON credit_cards(user_id, due_date);

ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS credit_cards_select ON credit_cards;
DROP POLICY IF EXISTS credit_cards_insert ON credit_cards;
DROP POLICY IF EXISTS credit_cards_update ON credit_cards;
DROP POLICY IF EXISTS credit_cards_delete ON credit_cards;

CREATE POLICY credit_cards_select ON credit_cards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY credit_cards_insert ON credit_cards FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY credit_cards_update ON credit_cards FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY credit_cards_delete ON credit_cards FOR DELETE USING (auth.uid() = user_id);
