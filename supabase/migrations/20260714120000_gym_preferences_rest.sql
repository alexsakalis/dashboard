ALTER TABLE gym_preferences
  ADD COLUMN IF NOT EXISTS default_rest_seconds int NOT NULL DEFAULT 90;
