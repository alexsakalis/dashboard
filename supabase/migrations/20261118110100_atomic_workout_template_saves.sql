CREATE OR REPLACE FUNCTION create_workout_template_with_exercises(
  p_user_id uuid,
  p_name text,
  p_split text,
  p_muscle_groups text[],
  p_exercises jsonb
)
RETURNS workout_templates
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_template workout_templates;
BEGIN
  INSERT INTO workout_templates (
    user_id,
    name,
    split,
    muscle_groups,
    exercises
  )
  VALUES (
    p_user_id,
    p_name,
    p_split,
    COALESCE(p_muscle_groups, '{}'::text[]),
    COALESCE(p_exercises, '[]'::jsonb)
  )
  RETURNING * INTO v_template;

  INSERT INTO workout_template_exercises (
    template_id,
    user_id,
    exercise_library_id,
    exercise_name,
    muscle_group,
    default_sets,
    default_reps,
    sort_order,
    notes
  )
  SELECT
    v_template.id,
    p_user_id,
    NULLIF(exercise ->> 'exercise_library_id', '')::uuid,
    exercise ->> 'exercise_name',
    NULLIF(exercise ->> 'muscle_group', ''),
    COALESCE(NULLIF(exercise ->> 'default_sets', '')::int, 3),
    NULLIF(exercise ->> 'default_reps', '')::int,
    (ordinality - 1)::int,
    NULLIF(exercise ->> 'notes', '')
  FROM jsonb_array_elements(COALESCE(p_exercises, '[]'::jsonb)) WITH ORDINALITY AS items(exercise, ordinality);

  RETURN v_template;
END;
$$;

CREATE OR REPLACE FUNCTION update_workout_template_with_exercises(
  p_template_id uuid,
  p_user_id uuid,
  p_name text,
  p_split text,
  p_muscle_groups text[],
  p_exercises jsonb
)
RETURNS workout_templates
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_template workout_templates;
BEGIN
  UPDATE workout_templates
  SET
    name = p_name,
    split = p_split,
    muscle_groups = COALESCE(p_muscle_groups, '{}'::text[]),
    exercises = COALESCE(p_exercises, '[]'::jsonb)
  WHERE id = p_template_id
    AND user_id = p_user_id
  RETURNING * INTO v_template;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Workout template not found' USING ERRCODE = 'P0002';
  END IF;

  DELETE FROM workout_template_exercises
  WHERE template_id = p_template_id
    AND user_id = p_user_id;

  INSERT INTO workout_template_exercises (
    template_id,
    user_id,
    exercise_library_id,
    exercise_name,
    muscle_group,
    default_sets,
    default_reps,
    sort_order,
    notes
  )
  SELECT
    p_template_id,
    p_user_id,
    NULLIF(exercise ->> 'exercise_library_id', '')::uuid,
    exercise ->> 'exercise_name',
    NULLIF(exercise ->> 'muscle_group', ''),
    COALESCE(NULLIF(exercise ->> 'default_sets', '')::int, 3),
    NULLIF(exercise ->> 'default_reps', '')::int,
    (ordinality - 1)::int,
    NULLIF(exercise ->> 'notes', '')
  FROM jsonb_array_elements(COALESCE(p_exercises, '[]'::jsonb)) WITH ORDINALITY AS items(exercise, ordinality);

  RETURN v_template;
END;
$$;
