-- Habit completions must belong to the same user as their parent habit.
-- Otherwise a user can occupy the per-habit daily unique key for someone else's
-- habit and prevent the owner from recording that day's completion.
DELETE FROM public.habit_completions hc
WHERE NOT EXISTS (
  SELECT 1
  FROM public.habits h
  WHERE h.id = hc.habit_id
    AND h.user_id = hc.user_id
);

DROP POLICY IF EXISTS habit_completions_select ON public.habit_completions;
DROP POLICY IF EXISTS habit_completions_insert ON public.habit_completions;
DROP POLICY IF EXISTS habit_completions_update ON public.habit_completions;
DROP POLICY IF EXISTS habit_completions_delete ON public.habit_completions;

CREATE POLICY habit_completions_select
  ON public.habit_completions
  FOR SELECT
  USING (
    auth.uid() = habit_completions.user_id
    AND EXISTS (
      SELECT 1
      FROM public.habits h
      WHERE h.id = habit_completions.habit_id
        AND h.user_id = auth.uid()
    )
  );

CREATE POLICY habit_completions_insert
  ON public.habit_completions
  FOR INSERT
  WITH CHECK (
    auth.uid() = habit_completions.user_id
    AND EXISTS (
      SELECT 1
      FROM public.habits h
      WHERE h.id = habit_completions.habit_id
        AND h.user_id = auth.uid()
    )
  );

CREATE POLICY habit_completions_update
  ON public.habit_completions
  FOR UPDATE
  USING (
    auth.uid() = habit_completions.user_id
    AND EXISTS (
      SELECT 1
      FROM public.habits h
      WHERE h.id = habit_completions.habit_id
        AND h.user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = habit_completions.user_id
    AND EXISTS (
      SELECT 1
      FROM public.habits h
      WHERE h.id = habit_completions.habit_id
        AND h.user_id = auth.uid()
    )
  );

CREATE POLICY habit_completions_delete
  ON public.habit_completions
  FOR DELETE
  USING (
    auth.uid() = habit_completions.user_id
    AND EXISTS (
      SELECT 1
      FROM public.habits h
      WHERE h.id = habit_completions.habit_id
        AND h.user_id = auth.uid()
    )
  );
