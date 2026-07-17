-- Ensure journal entries have a single row per user/date so upserts cannot race into duplicates.

WITH ranked_notes AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY user_id, note_type, title
      ORDER BY updated_at DESC, created_at DESC, id DESC
    ) AS duplicate_rank
  FROM notes
  WHERE title IS NOT NULL
)
DELETE FROM notes
WHERE id IN (
  SELECT id
  FROM ranked_notes
  WHERE duplicate_rank > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_user_type_title_unique
  ON notes (user_id, note_type, title);
