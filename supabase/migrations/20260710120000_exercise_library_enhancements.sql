-- Exercise library enhancements: rich metadata + user preferences

ALTER TABLE exercise_library
  ADD COLUMN IF NOT EXISTS body_part text,
  ADD COLUMN IF NOT EXISTS secondary_muscle_groups text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS movement_pattern text,
  ADD COLUMN IF NOT EXISTS movement_type text,
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS split_tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS instructions text;

-- Backfill body_part from muscle_group for existing rows
UPDATE exercise_library
SET body_part = muscle_group
WHERE body_part IS NULL;

ALTER TABLE exercise_library
  ALTER COLUMN body_part SET NOT NULL;

ALTER TABLE exercise_library
  DROP CONSTRAINT IF EXISTS exercise_library_movement_type_check,
  ADD CONSTRAINT exercise_library_movement_type_check
    CHECK (movement_type IS NULL OR movement_type IN ('compound', 'isolation'));

ALTER TABLE exercise_library
  DROP CONSTRAINT IF EXISTS exercise_library_difficulty_check,
  ADD CONSTRAINT exercise_library_difficulty_check
    CHECK (difficulty IS NULL OR difficulty IN ('beginner', 'intermediate', 'advanced'));

ALTER TABLE exercise_library
  DROP CONSTRAINT IF EXISTS exercise_library_body_part_check,
  ADD CONSTRAINT exercise_library_body_part_check
    CHECK (body_part IN (
      'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
      'core', 'quads', 'hamstrings', 'glutes', 'calves', 'traps',
      'neck', 'cardio', 'full_body'
    ));

CREATE INDEX IF NOT EXISTS idx_exercise_library_body_muscle
  ON exercise_library (body_part, muscle_group);

CREATE INDEX IF NOT EXISTS idx_exercise_library_equipment
  ON exercise_library (equipment);

CREATE INDEX IF NOT EXISTS idx_exercise_library_difficulty
  ON exercise_library (difficulty);

CREATE INDEX IF NOT EXISTS idx_exercise_library_movement_type
  ON exercise_library (movement_type);

CREATE INDEX IF NOT EXISTS idx_exercise_library_aliases_gin
  ON exercise_library USING gin (aliases);

CREATE INDEX IF NOT EXISTS idx_exercise_library_secondary_muscles_gin
  ON exercise_library USING gin (secondary_muscle_groups);

CREATE INDEX IF NOT EXISTS idx_exercise_library_split_tags_gin
  ON exercise_library USING gin (split_tags);

-- User preferences for favorites and hidden exercises
CREATE TABLE IF NOT EXISTS exercise_user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_library_id uuid NOT NULL REFERENCES exercise_library(id) ON DELETE CASCADE,
  is_favorite boolean NOT NULL DEFAULT false,
  is_hidden boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, exercise_library_id)
);

CREATE INDEX IF NOT EXISTS idx_exercise_user_prefs_user
  ON exercise_user_preferences (user_id);

CREATE INDEX IF NOT EXISTS idx_exercise_user_prefs_favorite
  ON exercise_user_preferences (user_id, is_favorite)
  WHERE is_favorite = true;

ALTER TABLE exercise_user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exercise_user_preferences_select ON exercise_user_preferences;
DROP POLICY IF EXISTS exercise_user_preferences_insert ON exercise_user_preferences;
DROP POLICY IF EXISTS exercise_user_preferences_update ON exercise_user_preferences;
DROP POLICY IF EXISTS exercise_user_preferences_delete ON exercise_user_preferences;

CREATE POLICY exercise_user_preferences_select ON exercise_user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY exercise_user_preferences_insert ON exercise_user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY exercise_user_preferences_update ON exercise_user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY exercise_user_preferences_delete ON exercise_user_preferences
  FOR DELETE USING (auth.uid() = user_id);
