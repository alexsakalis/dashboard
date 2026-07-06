-- Personal Daily-Life Dashboard schema

-- Task categories
CREATE TABLE IF NOT EXISTS task_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  icon text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Recurrence rules
CREATE TABLE IF NOT EXISTS recurrence_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  frequency text NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  interval int NOT NULL DEFAULT 1,
  days_of_week int[],
  next_occurrence date,
  template_task jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'done', 'archived')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category_id uuid REFERENCES task_categories(id) ON DELETE SET NULL,
  due_date date,
  completed_at timestamptz,
  points_awarded int NOT NULL DEFAULT 0,
  recurrence_rule_id uuid REFERENCES recurrence_rules(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Habits
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  icon text,
  frequency text NOT NULL DEFAULT 'daily',
  points_per_completion int NOT NULL DEFAULT 5,
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  completed_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(habit_id, completed_date)
);

-- Gym
CREATE TABLE IF NOT EXISTS workout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  muscle_groups text[] NOT NULL DEFAULT '{}',
  exercises jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  workout_type text,
  muscle_groups text[] NOT NULL DEFAULT '{}',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  notes text,
  template_id uuid REFERENCES workout_templates(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workout_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  set_number int NOT NULL,
  reps int,
  weight numeric(6,2),
  unit text NOT NULL DEFAULT 'lbs',
  rpe numeric(3,1),
  is_warmup boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Health
CREATE TABLE IF NOT EXISTS health_daily_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  source text NOT NULL CHECK (source IN ('oura', 'apple_health')),
  sleep_score int,
  sleep_duration_min int,
  readiness_score int,
  hrv_ms numeric,
  resting_hr int,
  steps int,
  active_calories int,
  workout_count int,
  raw_payload jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date, source)
);

CREATE TABLE IF NOT EXISTS health_workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL,
  external_id text NOT NULL,
  activity_type text,
  start_time timestamptz NOT NULL,
  duration_min int,
  calories int,
  avg_hr int,
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, source, external_id)
);

-- Finance
CREATE TABLE IF NOT EXISTS finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  row_id uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  date date NOT NULL,
  amount numeric(12,2) NOT NULL,
  category text,
  merchant text,
  account text,
  notes text,
  entry_type text NOT NULL DEFAULT 'expense' CHECK (entry_type IN ('expense', 'income', 'transfer')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sync_source text NOT NULL DEFAULT 'app' CHECK (sync_source IN ('app', 'sheet')),
  version int NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS finance_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('pull', 'push')),
  rows_affected int NOT NULL DEFAULT 0,
  status text NOT NULL,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Scoring
CREATE TABLE IF NOT EXISTS daily_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  task_points int NOT NULL DEFAULT 0,
  habit_points int NOT NULL DEFAULT 0,
  streak_bonus int NOT NULL DEFAULT 0,
  total_score int NOT NULL DEFAULT 0,
  tasks_completed int NOT NULL DEFAULT 0,
  habits_completed int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS score_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  event_type text NOT NULL,
  reference_id uuid,
  points int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Integrations
CREATE TABLE IF NOT EXISTS integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('oura', 'google', 'apple_health')),
  access_token_enc text,
  refresh_token_enc text,
  token_expires_at timestamptz,
  config jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reauth_required', 'error')),
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Calendar cache
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  location text,
  source text NOT NULL DEFAULT 'google',
  raw_payload jsonb,
  synced_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, external_id)
);

-- Notes stub (future)
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  body text,
  note_type text NOT NULL DEFAULT 'quick' CHECK (note_type IN ('quick', 'journal', 'brain_dump')),
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_habit_completions_habit_date ON habit_completions(habit_id, completed_date DESC);
CREATE INDEX IF NOT EXISTS idx_workouts_user_completed ON workouts(user_id, completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(user_id, exercise_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_snapshots_user_date ON health_daily_snapshots(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_entries_user_date ON finance_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user_start ON calendar_events(user_id, start_time);

-- Updated_at trigger for tasks
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS tasks_updated_at ON tasks;
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS integrations_updated_at ON integrations;
CREATE TRIGGER integrations_updated_at BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurrence_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_daily_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE score_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies (user owns their data)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'task_categories', 'recurrence_rules', 'tasks', 'habits', 'habit_completions',
    'workout_templates', 'workouts', 'workout_sets', 'health_daily_snapshots',
    'health_workouts', 'finance_entries', 'finance_sync_log', 'daily_scores',
    'score_events', 'integrations', 'calendar_events', 'notes'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON %I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON %I', t, t);

    EXECUTE format('CREATE POLICY %I_select ON %I FOR SELECT USING (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY %I_insert ON %I FOR INSERT WITH CHECK (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY %I_update ON %I FOR UPDATE USING (auth.uid() = user_id)', t, t);
    EXECUTE format('CREATE POLICY %I_delete ON %I FOR DELETE USING (auth.uid() = user_id)', t, t);
  END LOOP;
END $$;
