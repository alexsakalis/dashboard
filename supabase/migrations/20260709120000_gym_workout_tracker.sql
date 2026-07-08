-- Gym workout tracker: extended schema for splits, exercises, body weight, PRs

-- Extend workouts
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS split text,
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS overall_rpe numeric(3,1),
  ADD COLUMN IF NOT EXISTS body_weight numeric(6,2),
  ADD COLUMN IF NOT EXISTS body_weight_unit text NOT NULL DEFAULT 'lbs',
  ADD COLUMN IF NOT EXISTS duration_seconds int,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

UPDATE workouts SET split = lower(trim(workout_type))
WHERE split IS NULL AND workout_type IS NOT NULL;

ALTER TABLE workouts
  DROP CONSTRAINT IF EXISTS workouts_split_check,
  ADD CONSTRAINT workouts_split_check
    CHECK (split IS NULL OR split IN ('push','pull','legs','upper','lower','full_body','custom'));

-- Exercise library (system defaults have user_id NULL)
CREATE TABLE IF NOT EXISTS exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  muscle_group text NOT NULL,
  equipment text,
  aliases text[] NOT NULL DEFAULT '{}',
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_exercise_library_user_name
  ON exercise_library (user_id, lower(name));

-- Workout exercises (ordered exercises within a session)
CREATE TABLE IF NOT EXISTS workout_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_library_id uuid REFERENCES exercise_library(id) ON DELETE SET NULL,
  exercise_name text NOT NULL,
  muscle_group text,
  sort_order int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON workout_exercises(workout_id, sort_order);

-- Extend workout_sets
ALTER TABLE workout_sets
  ADD COLUMN IF NOT EXISTS workout_exercise_id uuid REFERENCES workout_exercises(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS rest_seconds int,
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise_id ON workout_sets(workout_exercise_id, sort_order);

-- Backfill workout_exercises from existing sets
DO $$
DECLARE
  w record;
  ex record;
  new_exercise_id uuid;
  sort_idx int;
BEGIN
  FOR w IN SELECT DISTINCT workout_id, user_id FROM workout_sets LOOP
    sort_idx := 0;
    FOR ex IN
      SELECT exercise_name, MIN(set_number) AS first_set
      FROM workout_sets
      WHERE workout_id = w.workout_id
      GROUP BY exercise_name
      ORDER BY MIN(set_number), exercise_name
    LOOP
      INSERT INTO workout_exercises (user_id, workout_id, exercise_name, sort_order)
      VALUES (w.user_id, w.workout_id, ex.exercise_name, sort_idx)
      RETURNING id INTO new_exercise_id;

      UPDATE workout_sets
      SET workout_exercise_id = new_exercise_id,
          sort_order = set_number
      WHERE workout_id = w.workout_id AND exercise_name = ex.exercise_name;

      sort_idx := sort_idx + 1;
    END LOOP;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_workout_sets_exercise_set_number
  ON workout_sets (workout_exercise_id, set_number)
  WHERE workout_exercise_id IS NOT NULL;

-- Template extensions
ALTER TABLE workout_templates
  ADD COLUMN IF NOT EXISTS split text,
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS workout_template_exercises (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_library_id uuid REFERENCES exercise_library(id) ON DELETE SET NULL,
  exercise_name text NOT NULL,
  muscle_group text,
  default_sets int NOT NULL DEFAULT 3,
  default_reps int,
  sort_order int NOT NULL DEFAULT 0,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_template_exercises_template ON workout_template_exercises(template_id, sort_order);

-- Body weight logs
CREATE TABLE IF NOT EXISTS body_weight_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  logged_date date NOT NULL,
  weight numeric(6,2) NOT NULL,
  unit text NOT NULL DEFAULT 'lbs',
  workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','apple_health','workout')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, logged_date, source)
);

CREATE INDEX IF NOT EXISTS idx_body_weight_user_date ON body_weight_logs(user_id, logged_date DESC);

-- Personal records cache
CREATE TABLE IF NOT EXISTS exercise_personal_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_name text NOT NULL,
  record_type text NOT NULL CHECK (record_type IN ('max_weight','max_reps','estimated_1rm','max_volume_set')),
  value numeric(10,2) NOT NULL,
  reps int,
  weight numeric(6,2),
  achieved_at timestamptz NOT NULL,
  workout_id uuid REFERENCES workouts(id) ON DELETE SET NULL,
  set_id uuid REFERENCES workout_sets(id) ON DELETE SET NULL,
  UNIQUE(user_id, exercise_name, record_type)
);

CREATE INDEX IF NOT EXISTS idx_exercise_prs_user ON exercise_personal_records(user_id, achieved_at DESC);

-- Gym preferences
CREATE TABLE IF NOT EXISTS gym_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_weight_unit text NOT NULL DEFAULT 'lbs',
  preferred_splits text[] NOT NULL DEFAULT '{push,pull,legs}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exercise_library_select ON exercise_library;
DROP POLICY IF EXISTS exercise_library_insert ON exercise_library;
DROP POLICY IF EXISTS exercise_library_update ON exercise_library;
DROP POLICY IF EXISTS exercise_library_delete ON exercise_library;

CREATE POLICY exercise_library_select ON exercise_library FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY exercise_library_insert ON exercise_library FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY exercise_library_update ON exercise_library FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY exercise_library_delete ON exercise_library FOR DELETE
  USING (auth.uid() = user_id);

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'workout_exercises', 'workout_template_exercises',
    'body_weight_logs', 'exercise_personal_records'
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

DROP POLICY IF EXISTS gym_preferences_select ON gym_preferences;
DROP POLICY IF EXISTS gym_preferences_insert ON gym_preferences;
DROP POLICY IF EXISTS gym_preferences_update ON gym_preferences;
DROP POLICY IF EXISTS gym_preferences_delete ON gym_preferences;

CREATE POLICY gym_preferences_select ON gym_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY gym_preferences_insert ON gym_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY gym_preferences_update ON gym_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY gym_preferences_delete ON gym_preferences FOR DELETE USING (auth.uid() = user_id);
