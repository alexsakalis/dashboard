-- Require gym child rows to reference parent rows owned by the caller.
-- Public Supabase tables are reachable through the Data API, so checking only
-- a child row's user_id allows forged references to another user's workout.

DROP POLICY IF EXISTS workout_exercises_select ON workout_exercises;
DROP POLICY IF EXISTS workout_exercises_insert ON workout_exercises;
DROP POLICY IF EXISTS workout_exercises_update ON workout_exercises;
DROP POLICY IF EXISTS workout_exercises_delete ON workout_exercises;

CREATE POLICY workout_exercises_select ON workout_exercises
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
        AND workouts.user_id = (SELECT auth.uid())
    )
    AND (
      exercise_library_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM exercise_library
        WHERE exercise_library.id = workout_exercises.exercise_library_id
          AND (
            exercise_library.user_id IS NULL
            OR exercise_library.user_id = (SELECT auth.uid())
          )
      )
    )
  );

CREATE POLICY workout_exercises_insert ON workout_exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
        AND workouts.user_id = (SELECT auth.uid())
    )
    AND (
      exercise_library_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM exercise_library
        WHERE exercise_library.id = workout_exercises.exercise_library_id
          AND (
            exercise_library.user_id IS NULL
            OR exercise_library.user_id = (SELECT auth.uid())
          )
      )
    )
  );

CREATE POLICY workout_exercises_update ON workout_exercises
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
        AND workouts.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
        AND workouts.user_id = (SELECT auth.uid())
    )
    AND (
      exercise_library_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM exercise_library
        WHERE exercise_library.id = workout_exercises.exercise_library_id
          AND (
            exercise_library.user_id IS NULL
            OR exercise_library.user_id = (SELECT auth.uid())
          )
      )
    )
  );

CREATE POLICY workout_exercises_delete ON workout_exercises
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
        AND workouts.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS workout_sets_select ON workout_sets;
DROP POLICY IF EXISTS workout_sets_insert ON workout_sets;
DROP POLICY IF EXISTS workout_sets_update ON workout_sets;
DROP POLICY IF EXISTS workout_sets_delete ON workout_sets;

CREATE POLICY workout_sets_select ON workout_sets
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workouts
      WHERE workouts.id = workout_sets.workout_id
        AND workouts.user_id = (SELECT auth.uid())
    )
    AND (
      workout_exercise_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workout_exercises
        WHERE workout_exercises.id = workout_sets.workout_exercise_id
          AND workout_exercises.workout_id = workout_sets.workout_id
          AND workout_exercises.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY workout_sets_insert ON workout_sets
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workouts
      WHERE workouts.id = workout_sets.workout_id
        AND workouts.user_id = (SELECT auth.uid())
    )
    AND (
      workout_exercise_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workout_exercises
        WHERE workout_exercises.id = workout_sets.workout_exercise_id
          AND workout_exercises.workout_id = workout_sets.workout_id
          AND workout_exercises.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY workout_sets_update ON workout_sets
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workouts
      WHERE workouts.id = workout_sets.workout_id
        AND workouts.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workouts
      WHERE workouts.id = workout_sets.workout_id
        AND workouts.user_id = (SELECT auth.uid())
    )
    AND (
      workout_exercise_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workout_exercises
        WHERE workout_exercises.id = workout_sets.workout_exercise_id
          AND workout_exercises.workout_id = workout_sets.workout_id
          AND workout_exercises.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY workout_sets_delete ON workout_sets
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workouts
      WHERE workouts.id = workout_sets.workout_id
        AND workouts.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS workout_template_exercises_select ON workout_template_exercises;
DROP POLICY IF EXISTS workout_template_exercises_insert ON workout_template_exercises;
DROP POLICY IF EXISTS workout_template_exercises_update ON workout_template_exercises;
DROP POLICY IF EXISTS workout_template_exercises_delete ON workout_template_exercises;

CREATE POLICY workout_template_exercises_select ON workout_template_exercises
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workout_templates
      WHERE workout_templates.id = workout_template_exercises.template_id
        AND workout_templates.user_id = (SELECT auth.uid())
    )
    AND (
      exercise_library_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM exercise_library
        WHERE exercise_library.id = workout_template_exercises.exercise_library_id
          AND (
            exercise_library.user_id IS NULL
            OR exercise_library.user_id = (SELECT auth.uid())
          )
      )
    )
  );

CREATE POLICY workout_template_exercises_insert ON workout_template_exercises
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workout_templates
      WHERE workout_templates.id = workout_template_exercises.template_id
        AND workout_templates.user_id = (SELECT auth.uid())
    )
    AND (
      exercise_library_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM exercise_library
        WHERE exercise_library.id = workout_template_exercises.exercise_library_id
          AND (
            exercise_library.user_id IS NULL
            OR exercise_library.user_id = (SELECT auth.uid())
          )
      )
    )
  );

CREATE POLICY workout_template_exercises_update ON workout_template_exercises
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workout_templates
      WHERE workout_templates.id = workout_template_exercises.template_id
        AND workout_templates.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workout_templates
      WHERE workout_templates.id = workout_template_exercises.template_id
        AND workout_templates.user_id = (SELECT auth.uid())
    )
    AND (
      exercise_library_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM exercise_library
        WHERE exercise_library.id = workout_template_exercises.exercise_library_id
          AND (
            exercise_library.user_id IS NULL
            OR exercise_library.user_id = (SELECT auth.uid())
          )
      )
    )
  );

CREATE POLICY workout_template_exercises_delete ON workout_template_exercises
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM workout_templates
      WHERE workout_templates.id = workout_template_exercises.template_id
        AND workout_templates.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS body_weight_logs_select ON body_weight_logs;
DROP POLICY IF EXISTS body_weight_logs_insert ON body_weight_logs;
DROP POLICY IF EXISTS body_weight_logs_update ON body_weight_logs;
DROP POLICY IF EXISTS body_weight_logs_delete ON body_weight_logs;

CREATE POLICY body_weight_logs_select ON body_weight_logs
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND (
      workout_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workouts
        WHERE workouts.id = body_weight_logs.workout_id
          AND workouts.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY body_weight_logs_insert ON body_weight_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      workout_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workouts
        WHERE workouts.id = body_weight_logs.workout_id
          AND workouts.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY body_weight_logs_update ON body_weight_logs
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND (
      workout_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workouts
        WHERE workouts.id = body_weight_logs.workout_id
          AND workouts.user_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      workout_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workouts
        WHERE workouts.id = body_weight_logs.workout_id
          AND workouts.user_id = (SELECT auth.uid())
      )
    )
  );

CREATE POLICY body_weight_logs_delete ON body_weight_logs
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND (
      workout_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workouts
        WHERE workouts.id = body_weight_logs.workout_id
          AND workouts.user_id = (SELECT auth.uid())
      )
    )
  );

DROP POLICY IF EXISTS exercise_personal_records_select ON exercise_personal_records;
DROP POLICY IF EXISTS exercise_personal_records_insert ON exercise_personal_records;
DROP POLICY IF EXISTS exercise_personal_records_update ON exercise_personal_records;
DROP POLICY IF EXISTS exercise_personal_records_delete ON exercise_personal_records;

CREATE POLICY exercise_personal_records_select ON exercise_personal_records
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND (
      workout_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workouts
        WHERE workouts.id = exercise_personal_records.workout_id
          AND workouts.user_id = (SELECT auth.uid())
      )
    )
    AND (
      set_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workout_sets
        WHERE workout_sets.id = exercise_personal_records.set_id
          AND workout_sets.user_id = (SELECT auth.uid())
          AND (
            exercise_personal_records.workout_id IS NULL
            OR workout_sets.workout_id = exercise_personal_records.workout_id
          )
      )
    )
  );

CREATE POLICY exercise_personal_records_insert ON exercise_personal_records
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      workout_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workouts
        WHERE workouts.id = exercise_personal_records.workout_id
          AND workouts.user_id = (SELECT auth.uid())
      )
    )
    AND (
      set_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workout_sets
        WHERE workout_sets.id = exercise_personal_records.set_id
          AND workout_sets.user_id = (SELECT auth.uid())
          AND (
            exercise_personal_records.workout_id IS NULL
            OR workout_sets.workout_id = exercise_personal_records.workout_id
          )
      )
    )
  );

CREATE POLICY exercise_personal_records_update ON exercise_personal_records
  FOR UPDATE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND (
      workout_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workouts
        WHERE workouts.id = exercise_personal_records.workout_id
          AND workouts.user_id = (SELECT auth.uid())
      )
    )
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (
      workout_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workouts
        WHERE workouts.id = exercise_personal_records.workout_id
          AND workouts.user_id = (SELECT auth.uid())
      )
    )
    AND (
      set_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workout_sets
        WHERE workout_sets.id = exercise_personal_records.set_id
          AND workout_sets.user_id = (SELECT auth.uid())
          AND (
            exercise_personal_records.workout_id IS NULL
            OR workout_sets.workout_id = exercise_personal_records.workout_id
          )
      )
    )
  );

CREATE POLICY exercise_personal_records_delete ON exercise_personal_records
  FOR DELETE
  TO authenticated
  USING (
    (SELECT auth.uid()) = user_id
    AND (
      workout_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM workouts
        WHERE workouts.id = exercise_personal_records.workout_id
          AND workouts.user_id = (SELECT auth.uid())
      )
    )
  );
