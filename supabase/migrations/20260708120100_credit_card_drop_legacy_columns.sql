-- Drop deprecated credit_cards columns after v2 migration

ALTER TABLE credit_cards
  DROP COLUMN IF EXISTS amount,
  DROP COLUMN IF EXISTS balance,
  DROP COLUMN IF EXISTS status,
  DROP COLUMN IF EXISTS snapshot_date;
