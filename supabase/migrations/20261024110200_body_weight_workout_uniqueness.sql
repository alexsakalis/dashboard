-- Preserve multiple workout-sourced body-weight logs on the same day.
--
-- The original uniqueness key collapsed all workout completions for a user/day
-- into one row, so finishing a second workout overwrote the first weigh-in.
ALTER TABLE body_weight_logs
  DROP CONSTRAINT IF EXISTS body_weight_logs_user_id_logged_date_source_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'body_weight_logs_user_date_source_workout_key'
      AND conrelid = 'body_weight_logs'::regclass
  ) THEN
    ALTER TABLE body_weight_logs
      ADD CONSTRAINT body_weight_logs_user_date_source_workout_key
      UNIQUE NULLS NOT DISTINCT (user_id, logged_date, source, workout_id);
  END IF;
END $$;
