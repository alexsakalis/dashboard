-- Require finance child rows to reference credit cards owned by the caller.
-- The anon key can reach public tables through the Data API, so checking only
-- the child row's user_id still allowed cross-user card_id references.

DROP POLICY IF EXISTS credit_card_payments_insert ON credit_card_payments;
DROP POLICY IF EXISTS credit_card_payments_update ON credit_card_payments;
DROP POLICY IF EXISTS credit_card_balance_snapshots_insert ON credit_card_balance_snapshots;
DROP POLICY IF EXISTS credit_card_balance_snapshots_update ON credit_card_balance_snapshots;

CREATE POLICY credit_card_payments_insert ON credit_card_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM credit_cards
      WHERE credit_cards.id = credit_card_payments.card_id
        AND credit_cards.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY credit_card_payments_update ON credit_card_payments
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM credit_cards
      WHERE credit_cards.id = credit_card_payments.card_id
        AND credit_cards.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY credit_card_balance_snapshots_insert ON credit_card_balance_snapshots
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM credit_cards
      WHERE credit_cards.id = credit_card_balance_snapshots.card_id
        AND credit_cards.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY credit_card_balance_snapshots_update ON credit_card_balance_snapshots
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM credit_cards
      WHERE credit_cards.id = credit_card_balance_snapshots.card_id
        AND credit_cards.user_id = (SELECT auth.uid())
    )
  );
