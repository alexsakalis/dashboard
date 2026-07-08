-- Seed system exercise library

INSERT INTO exercise_library (user_id, name, muscle_group, equipment, is_custom)
SELECT NULL, v.name, v.muscle_group, v.equipment, false
FROM (VALUES
  ('Barbell Bench Press', 'chest', 'barbell'),
  ('Incline Dumbbell Press', 'chest', 'dumbbell'),
  ('Dumbbell Fly', 'chest', 'dumbbell'),
  ('Cable Fly', 'chest', 'cable'),
  ('Push-Up', 'chest', 'bodyweight'),
  ('Overhead Press', 'shoulders', 'barbell'),
  ('Dumbbell Shoulder Press', 'shoulders', 'dumbbell'),
  ('Lateral Raise', 'shoulders', 'dumbbell'),
  ('Face Pull', 'shoulders', 'cable'),
  ('Tricep Pushdown', 'triceps', 'cable'),
  ('Skull Crusher', 'triceps', 'barbell'),
  ('Dip', 'triceps', 'bodyweight'),
  ('Pull-Up', 'back', 'bodyweight'),
  ('Lat Pulldown', 'back', 'cable'),
  ('Barbell Row', 'back', 'barbell'),
  ('Dumbbell Row', 'back', 'dumbbell'),
  ('Seated Cable Row', 'back', 'cable'),
  ('Deadlift', 'back', 'barbell'),
  ('Barbell Curl', 'biceps', 'barbell'),
  ('Dumbbell Curl', 'biceps', 'dumbbell'),
  ('Hammer Curl', 'biceps', 'dumbbell'),
  ('Barbell Squat', 'quads', 'barbell'),
  ('Leg Press', 'quads', 'machine'),
  ('Leg Extension', 'quads', 'machine'),
  ('Romanian Deadlift', 'hamstrings', 'barbell'),
  ('Leg Curl', 'hamstrings', 'machine'),
  ('Walking Lunge', 'quads', 'dumbbell'),
  ('Bulgarian Split Squat', 'quads', 'dumbbell'),
  ('Hip Thrust', 'glutes', 'barbell'),
  ('Calf Raise', 'calves', 'machine'),
  ('Plank', 'core', 'bodyweight'),
  ('Cable Crunch', 'core', 'cable'),
  ('Hanging Leg Raise', 'core', 'bodyweight'),
  ('Barbell Hip Thrust', 'glutes', 'barbell'),
  ('Incline Barbell Bench Press', 'chest', 'barbell'),
  ('Chin-Up', 'back', 'bodyweight'),
  ('Front Squat', 'quads', 'barbell'),
  ('Hack Squat', 'quads', 'machine'),
  ('Preacher Curl', 'biceps', 'barbell'),
  ('Close-Grip Bench Press', 'triceps', 'barbell')
) AS v(name, muscle_group, equipment)
WHERE NOT EXISTS (
  SELECT 1 FROM exercise_library el
  WHERE el.user_id IS NULL AND lower(el.name) = lower(v.name)
);
