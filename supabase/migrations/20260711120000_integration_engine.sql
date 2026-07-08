-- Integration Engine: extend integrations, sync logs, dashboard summary

-- Extend integrations table
ALTER TABLE integrations
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_success_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_failure_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_message text;

-- Backfill display names for existing rows
UPDATE integrations SET display_name = 'Oura Ring' WHERE provider = 'oura' AND display_name IS NULL;
UPDATE integrations SET display_name = 'Google Calendar' WHERE provider = 'google' AND display_name IS NULL;
UPDATE integrations SET display_name = 'Apple Health' WHERE provider = 'apple_health' AND display_name IS NULL;

-- Backfill last_success_at from last_synced_at
UPDATE integrations SET last_success_at = last_synced_at WHERE last_success_at IS NULL AND last_synced_at IS NOT NULL;

-- Drop rigid provider CHECK for future scalability
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_provider_check;

CREATE INDEX IF NOT EXISTS idx_integrations_user_enabled_status
  ON integrations(user_id, enabled, status);

-- Add activity_score to health snapshots
ALTER TABLE health_daily_snapshots
  ADD COLUMN IF NOT EXISTS activity_score int;

-- Integration sync logs
CREATE TABLE IF NOT EXISTS integration_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid REFERENCES integrations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  status text NOT NULL CHECK (status IN ('running', 'success', 'error', 'skipped')),
  message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  duration_ms int,
  metadata jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_user_started
  ON integration_sync_logs(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_logs_integration
  ON integration_sync_logs(integration_id, started_at DESC);

ALTER TABLE integration_sync_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY integration_sync_logs_select ON integration_sync_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Dashboard summary (one row per user)
CREATE TABLE IF NOT EXISTS dashboard_summary (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_score int,
  readiness_score int,
  activity_score int,
  latest_hrv numeric,
  resting_hr int,
  sleep_duration_min int,
  steps int,
  tasks_due_today int NOT NULL DEFAULT 0,
  tasks_completed_today int NOT NULL DEFAULT 0,
  habit_score numeric,
  daily_score int,
  score_streak int,
  weekly_workouts int NOT NULL DEFAULT 0,
  latest_body_weight numeric,
  gym_streak int NOT NULL DEFAULT 0,
  credit_card_balance numeric,
  credit_utilization numeric,
  minimum_due numeric,
  calendar_events_today int NOT NULL DEFAULT 0,
  last_sync timestamptz,
  card_data jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE dashboard_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY dashboard_summary_select ON dashboard_summary
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY dashboard_summary_insert ON dashboard_summary
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY dashboard_summary_update ON dashboard_summary
  FOR UPDATE USING (auth.uid() = user_id);
