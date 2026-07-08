-- Comprehensive exercise library seed with full metadata

-- Update existing seeded exercises with metadata
UPDATE exercise_library SET
  body_part = 'chest',
  secondary_muscle_groups = ARRAY['shoulders', 'triceps'],
  movement_pattern = 'horizontal_push',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'barbell bench press';

UPDATE exercise_library SET
  body_part = 'chest',
  secondary_muscle_groups = ARRAY['shoulders', 'triceps'],
  movement_pattern = 'horizontal_push',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'incline dumbbell press';

UPDATE exercise_library SET
  body_part = 'chest',
  secondary_muscle_groups = ARRAY['shoulders'],
  movement_pattern = 'horizontal_push',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'dumbbell fly';

UPDATE exercise_library SET
  body_part = 'chest',
  secondary_muscle_groups = ARRAY['shoulders'],
  movement_pattern = 'horizontal_push',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'cable fly';

UPDATE exercise_library SET
  body_part = 'chest',
  secondary_muscle_groups = ARRAY['shoulders', 'triceps', 'core'],
  movement_pattern = 'horizontal_push',
  movement_type = 'compound',
  difficulty = 'beginner',
  split_tags = ARRAY['push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'push-up';

UPDATE exercise_library SET
  body_part = 'shoulders',
  secondary_muscle_groups = ARRAY['triceps', 'core'],
  movement_pattern = 'vertical_push',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'overhead press';

UPDATE exercise_library SET
  body_part = 'shoulders',
  secondary_muscle_groups = ARRAY['triceps'],
  movement_pattern = 'vertical_push',
  movement_type = 'compound',
  difficulty = 'beginner',
  split_tags = ARRAY['push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'dumbbell shoulder press';

UPDATE exercise_library SET
  body_part = 'shoulders',
  secondary_muscle_groups = '{}',
  movement_pattern = 'isolation',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'lateral raise';

UPDATE exercise_library SET
  body_part = 'shoulders',
  secondary_muscle_groups = ARRAY['back'],
  movement_pattern = 'horizontal_pull',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['pull', 'push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'face pull';

UPDATE exercise_library SET
  body_part = 'triceps',
  secondary_muscle_groups = '{}',
  movement_pattern = 'isolation',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'tricep pushdown';

UPDATE exercise_library SET
  body_part = 'triceps',
  secondary_muscle_groups = '{}',
  movement_pattern = 'isolation',
  movement_type = 'isolation',
  difficulty = 'intermediate',
  split_tags = ARRAY['push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'skull crusher';

UPDATE exercise_library SET
  body_part = 'triceps',
  secondary_muscle_groups = ARRAY['chest', 'shoulders'],
  movement_pattern = 'vertical_push',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'dip';

UPDATE exercise_library SET
  body_part = 'back',
  secondary_muscle_groups = ARRAY['biceps', 'core'],
  movement_pattern = 'vertical_pull',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['pull', 'upper']
WHERE user_id IS NULL AND lower(name) = 'pull-up';

UPDATE exercise_library SET
  body_part = 'back',
  secondary_muscle_groups = ARRAY['biceps'],
  movement_pattern = 'vertical_pull',
  movement_type = 'compound',
  difficulty = 'beginner',
  split_tags = ARRAY['pull', 'upper']
WHERE user_id IS NULL AND lower(name) = 'lat pulldown';

UPDATE exercise_library SET
  body_part = 'back',
  secondary_muscle_groups = ARRAY['biceps', 'core'],
  movement_pattern = 'horizontal_pull',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['pull', 'upper']
WHERE user_id IS NULL AND lower(name) = 'barbell row';

UPDATE exercise_library SET
  body_part = 'back',
  secondary_muscle_groups = ARRAY['biceps'],
  movement_pattern = 'horizontal_pull',
  movement_type = 'compound',
  difficulty = 'beginner',
  split_tags = ARRAY['pull', 'upper']
WHERE user_id IS NULL AND lower(name) = 'dumbbell row';

UPDATE exercise_library SET
  body_part = 'back',
  secondary_muscle_groups = ARRAY['biceps'],
  movement_pattern = 'horizontal_pull',
  movement_type = 'compound',
  difficulty = 'beginner',
  split_tags = ARRAY['pull', 'upper']
WHERE user_id IS NULL AND lower(name) = 'seated cable row';

UPDATE exercise_library SET
  body_part = 'back',
  secondary_muscle_groups = ARRAY['hamstrings', 'glutes', 'core', 'traps'],
  movement_pattern = 'hinge',
  movement_type = 'compound',
  difficulty = 'advanced',
  split_tags = ARRAY['pull', 'legs', 'lower', 'full_body']
WHERE user_id IS NULL AND lower(name) = 'deadlift';

UPDATE exercise_library SET
  body_part = 'biceps',
  secondary_muscle_groups = '{}',
  movement_pattern = 'isolation',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['pull', 'upper']
WHERE user_id IS NULL AND lower(name) = 'barbell curl';

UPDATE exercise_library SET
  body_part = 'biceps',
  secondary_muscle_groups = '{}',
  movement_pattern = 'isolation',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['pull', 'upper']
WHERE user_id IS NULL AND lower(name) = 'dumbbell curl';

UPDATE exercise_library SET
  body_part = 'biceps',
  secondary_muscle_groups = ARRAY['forearms'],
  movement_pattern = 'isolation',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['pull', 'upper']
WHERE user_id IS NULL AND lower(name) = 'hammer curl';

UPDATE exercise_library SET
  body_part = 'quads',
  secondary_muscle_groups = ARRAY['glutes', 'core'],
  movement_pattern = 'squat',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['legs', 'lower', 'full_body']
WHERE user_id IS NULL AND lower(name) = 'barbell squat';

UPDATE exercise_library SET
  body_part = 'quads',
  secondary_muscle_groups = ARRAY['glutes'],
  movement_pattern = 'squat',
  movement_type = 'compound',
  difficulty = 'beginner',
  split_tags = ARRAY['legs', 'lower']
WHERE user_id IS NULL AND lower(name) = 'leg press';

UPDATE exercise_library SET
  body_part = 'quads',
  secondary_muscle_groups = '{}',
  movement_pattern = 'isolation',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['legs', 'lower']
WHERE user_id IS NULL AND lower(name) = 'leg extension';

UPDATE exercise_library SET
  body_part = 'hamstrings',
  secondary_muscle_groups = ARRAY['glutes', 'back'],
  movement_pattern = 'hinge',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['legs', 'lower', 'pull']
WHERE user_id IS NULL AND lower(name) = 'romanian deadlift';

UPDATE exercise_library SET
  body_part = 'hamstrings',
  secondary_muscle_groups = '{}',
  movement_pattern = 'isolation',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['legs', 'lower']
WHERE user_id IS NULL AND lower(name) = 'leg curl';

UPDATE exercise_library SET
  body_part = 'quads',
  secondary_muscle_groups = ARRAY['glutes', 'hamstrings'],
  movement_pattern = 'lunge',
  movement_type = 'compound',
  difficulty = 'beginner',
  split_tags = ARRAY['legs', 'lower']
WHERE user_id IS NULL AND lower(name) = 'walking lunge';

UPDATE exercise_library SET
  body_part = 'quads',
  secondary_muscle_groups = ARRAY['glutes', 'hamstrings'],
  movement_pattern = 'lunge',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['legs', 'lower']
WHERE user_id IS NULL AND lower(name) = 'bulgarian split squat';

UPDATE exercise_library SET
  body_part = 'glutes',
  secondary_muscle_groups = ARRAY['hamstrings', 'core'],
  movement_pattern = 'hinge',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['legs', 'lower']
WHERE user_id IS NULL AND lower(name) = 'hip thrust';

UPDATE exercise_library SET
  body_part = 'calves',
  secondary_muscle_groups = '{}',
  movement_pattern = 'isolation',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['legs', 'lower']
WHERE user_id IS NULL AND lower(name) = 'calf raise';

UPDATE exercise_library SET
  body_part = 'core',
  secondary_muscle_groups = ARRAY['shoulders'],
  movement_pattern = 'isolation',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['full_body']
WHERE user_id IS NULL AND lower(name) = 'plank';

UPDATE exercise_library SET
  body_part = 'core',
  secondary_muscle_groups = '{}',
  movement_pattern = 'isolation',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['full_body']
WHERE user_id IS NULL AND lower(name) = 'cable crunch';

UPDATE exercise_library SET
  body_part = 'core',
  secondary_muscle_groups = ARRAY['hip flexors'],
  movement_pattern = 'isolation',
  movement_type = 'isolation',
  difficulty = 'intermediate',
  split_tags = ARRAY['full_body']
WHERE user_id IS NULL AND lower(name) = 'hanging leg raise';

UPDATE exercise_library SET
  body_part = 'glutes',
  secondary_muscle_groups = ARRAY['hamstrings', 'core'],
  movement_pattern = 'hinge',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['legs', 'lower']
WHERE user_id IS NULL AND lower(name) = 'barbell hip thrust';

UPDATE exercise_library SET
  body_part = 'chest',
  secondary_muscle_groups = ARRAY['shoulders', 'triceps'],
  movement_pattern = 'horizontal_push',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'incline barbell bench press';

UPDATE exercise_library SET
  body_part = 'back',
  secondary_muscle_groups = ARRAY['biceps'],
  movement_pattern = 'vertical_pull',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['pull', 'upper']
WHERE user_id IS NULL AND lower(name) = 'chin-up';

UPDATE exercise_library SET
  body_part = 'quads',
  secondary_muscle_groups = ARRAY['glutes', 'core'],
  movement_pattern = 'squat',
  movement_type = 'compound',
  difficulty = 'advanced',
  split_tags = ARRAY['legs', 'lower', 'full_body']
WHERE user_id IS NULL AND lower(name) = 'front squat';

UPDATE exercise_library SET
  body_part = 'quads',
  secondary_muscle_groups = ARRAY['glutes'],
  movement_pattern = 'squat',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['legs', 'lower']
WHERE user_id IS NULL AND lower(name) = 'hack squat';

UPDATE exercise_library SET
  body_part = 'biceps',
  secondary_muscle_groups = '{}',
  movement_pattern = 'isolation',
  movement_type = 'isolation',
  difficulty = 'beginner',
  split_tags = ARRAY['pull', 'upper']
WHERE user_id IS NULL AND lower(name) = 'preacher curl';

UPDATE exercise_library SET
  body_part = 'triceps',
  secondary_muscle_groups = ARRAY['chest', 'shoulders'],
  movement_pattern = 'horizontal_push',
  movement_type = 'compound',
  difficulty = 'intermediate',
  split_tags = ARRAY['push', 'upper']
WHERE user_id IS NULL AND lower(name) = 'close-grip bench press';

-- Insert new exercises (idempotent)
INSERT INTO exercise_library (
  user_id, name, body_part, muscle_group, secondary_muscle_groups,
  equipment, movement_pattern, movement_type, difficulty, split_tags, is_custom
)
SELECT NULL, v.name, v.body_part, v.muscle_group, v.secondary_muscle_groups,
       v.equipment, v.movement_pattern, v.movement_type, v.difficulty, v.split_tags, false
FROM (VALUES
  -- CHEST
  ('Decline Barbell Bench Press', 'chest', 'chest', ARRAY['shoulders', 'triceps'], 'barbell', 'horizontal_push', 'compound', 'intermediate', ARRAY['push', 'upper']),
  ('Decline Dumbbell Press', 'chest', 'chest', ARRAY['shoulders', 'triceps'], 'dumbbell', 'horizontal_push', 'compound', 'intermediate', ARRAY['push', 'upper']),
  ('Machine Chest Press', 'chest', 'chest', ARRAY['shoulders', 'triceps'], 'machine', 'horizontal_push', 'compound', 'beginner', ARRAY['push', 'upper']),
  ('Pec Deck Fly', 'chest', 'chest', ARRAY['shoulders'], 'machine', 'horizontal_push', 'isolation', 'beginner', ARRAY['push', 'upper']),
  ('Incline Cable Fly', 'chest', 'chest', ARRAY['shoulders'], 'cable', 'horizontal_push', 'isolation', 'beginner', ARRAY['push', 'upper']),
  ('Landmine Press', 'chest', 'chest', ARRAY['shoulders', 'triceps', 'core'], 'barbell', 'horizontal_push', 'compound', 'intermediate', ARRAY['push', 'upper']),
  ('Dumbbell Pullover', 'chest', 'chest', ARRAY['back', 'triceps'], 'dumbbell', 'isolation', 'isolation', 'intermediate', ARRAY['push', 'pull', 'upper']),
  ('Svend Press', 'chest', 'chest', ARRAY['shoulders'], 'dumbbell', 'horizontal_push', 'isolation', 'beginner', ARRAY['push', 'upper']),
  ('Floor Press', 'chest', 'chest', ARRAY['shoulders', 'triceps'], 'barbell', 'horizontal_push', 'compound', 'intermediate', ARRAY['push', 'upper']),
  ('Chest Dip', 'chest', 'chest', ARRAY['triceps', 'shoulders'], 'bodyweight', 'vertical_push', 'compound', 'intermediate', ARRAY['push', 'upper']),

  -- BACK
  ('T-Bar Row', 'back', 'back', ARRAY['biceps'], 'barbell', 'horizontal_pull', 'compound', 'intermediate', ARRAY['pull', 'upper']),
  ('Pendlay Row', 'back', 'back', ARRAY['biceps', 'core'], 'barbell', 'horizontal_pull', 'compound', 'intermediate', ARRAY['pull', 'upper']),
  ('Chest-Supported Row', 'back', 'back', ARRAY['biceps'], 'dumbbell', 'horizontal_pull', 'compound', 'beginner', ARRAY['pull', 'upper']),
  ('Single-Arm Cable Row', 'back', 'back', ARRAY['biceps'], 'cable', 'horizontal_pull', 'compound', 'beginner', ARRAY['pull', 'upper']),
  ('Straight-Arm Pulldown', 'back', 'back', ARRAY['triceps'], 'cable', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Machine Row', 'back', 'back', ARRAY['biceps'], 'machine', 'horizontal_pull', 'compound', 'beginner', ARRAY['pull', 'upper']),
  ('Inverted Row', 'back', 'back', ARRAY['biceps', 'core'], 'bodyweight', 'horizontal_pull', 'compound', 'beginner', ARRAY['pull', 'upper']),
  ('Rack Pull', 'back', 'back', ARRAY['glutes', 'hamstrings', 'traps'], 'barbell', 'hinge', 'compound', 'intermediate', ARRAY['pull', 'lower']),
  ('Meadows Row', 'back', 'back', ARRAY['biceps'], 'barbell', 'horizontal_pull', 'compound', 'intermediate', ARRAY['pull', 'upper']),
  ('Wide-Grip Pull-Up', 'back', 'back', ARRAY['biceps'], 'bodyweight', 'vertical_pull', 'compound', 'intermediate', ARRAY['pull', 'upper']),
  ('Neutral-Grip Pull-Up', 'back', 'back', ARRAY['biceps'], 'bodyweight', 'vertical_pull', 'compound', 'intermediate', ARRAY['pull', 'upper']),
  ('Assisted Pull-Up', 'back', 'back', ARRAY['biceps'], 'machine', 'vertical_pull', 'compound', 'beginner', ARRAY['pull', 'upper']),

  -- SHOULDERS
  ('Arnold Press', 'shoulders', 'shoulders', ARRAY['triceps'], 'dumbbell', 'vertical_push', 'compound', 'intermediate', ARRAY['push', 'upper']),
  ('Cable Lateral Raise', 'shoulders', 'shoulders', '{}', 'cable', 'isolation', 'isolation', 'beginner', ARRAY['push', 'upper']),
  ('Machine Shoulder Press', 'shoulders', 'shoulders', ARRAY['triceps'], 'machine', 'vertical_push', 'compound', 'beginner', ARRAY['push', 'upper']),
  ('Front Raise', 'shoulders', 'shoulders', '{}', 'dumbbell', 'isolation', 'isolation', 'beginner', ARRAY['push', 'upper']),
  ('Reverse Pec Deck', 'shoulders', 'shoulders', ARRAY['back'], 'machine', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Upright Row', 'shoulders', 'shoulders', ARRAY['traps', 'biceps'], 'barbell', 'vertical_pull', 'compound', 'intermediate', ARRAY['push', 'upper']),
  ('Cable Rear Delt Fly', 'shoulders', 'shoulders', ARRAY['back'], 'cable', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Push Press', 'shoulders', 'shoulders', ARRAY['triceps', 'legs'], 'barbell', 'vertical_push', 'compound', 'advanced', ARRAY['push', 'upper', 'full_body']),
  ('Landmine Lateral Raise', 'shoulders', 'shoulders', '{}', 'barbell', 'isolation', 'isolation', 'beginner', ARRAY['push', 'upper']),
  ('Band Pull-Apart', 'shoulders', 'shoulders', ARRAY['back'], 'band', 'horizontal_pull', 'isolation', 'beginner', ARRAY['pull', 'upper']),

  -- BICEPS
  ('Incline Dumbbell Curl', 'biceps', 'biceps', '{}', 'dumbbell', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Cable Curl', 'biceps', 'biceps', '{}', 'cable', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Concentration Curl', 'biceps', 'biceps', '{}', 'dumbbell', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('EZ Bar Curl', 'biceps', 'biceps', ARRAY['forearms'], 'barbell', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Spider Curl', 'biceps', 'biceps', '{}', 'dumbbell', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Machine Preacher Curl', 'biceps', 'biceps', '{}', 'machine', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Reverse Curl', 'biceps', 'biceps', ARRAY['forearms'], 'barbell', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Cross-Body Hammer Curl', 'biceps', 'biceps', ARRAY['forearms'], 'dumbbell', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),

  -- TRICEPS
  ('Overhead Tricep Extension', 'triceps', 'triceps', '{}', 'dumbbell', 'isolation', 'isolation', 'beginner', ARRAY['push', 'upper']),
  ('Cable Overhead Extension', 'triceps', 'triceps', '{}', 'cable', 'isolation', 'isolation', 'beginner', ARRAY['push', 'upper']),
  ('Rope Pushdown', 'triceps', 'triceps', '{}', 'cable', 'isolation', 'isolation', 'beginner', ARRAY['push', 'upper']),
  ('Diamond Push-Up', 'triceps', 'triceps', ARRAY['chest', 'shoulders'], 'bodyweight', 'horizontal_push', 'compound', 'intermediate', ARRAY['push', 'upper']),
  ('Bench Dip', 'triceps', 'triceps', ARRAY['chest', 'shoulders'], 'bodyweight', 'vertical_push', 'compound', 'beginner', ARRAY['push', 'upper']),
  ('JM Press', 'triceps', 'triceps', ARRAY['chest'], 'barbell', 'isolation', 'isolation', 'advanced', ARRAY['push', 'upper']),
  ('Kickback', 'triceps', 'triceps', '{}', 'dumbbell', 'isolation', 'isolation', 'beginner', ARRAY['push', 'upper']),
  ('Machine Tricep Extension', 'triceps', 'triceps', '{}', 'machine', 'isolation', 'isolation', 'beginner', ARRAY['push', 'upper']),

  -- FOREARMS
  ('Wrist Curl', 'forearms', 'forearms', '{}', 'dumbbell', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Reverse Wrist Curl', 'forearms', 'forearms', '{}', 'dumbbell', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Farmer Walk', 'forearms', 'forearms', ARRAY['traps', 'core'], 'dumbbell', 'carry', 'compound', 'beginner', ARRAY['full_body']),
  ('Plate Pinch', 'forearms', 'forearms', '{}', 'bodyweight', 'isolation', 'isolation', 'beginner', ARRAY['full_body']),
  ('Dead Hang', 'forearms', 'forearms', ARRAY['back'], 'bodyweight', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'full_body']),
  ('Wrist Roller', 'forearms', 'forearms', '{}', 'bodyweight', 'isolation', 'isolation', 'intermediate', ARRAY['full_body']),

  -- CORE
  ('Ab Wheel Rollout', 'core', 'core', ARRAY['shoulders', 'back'], 'bodyweight', 'isolation', 'isolation', 'intermediate', ARRAY['full_body']),
  ('Russian Twist', 'core', 'core', '{}', 'bodyweight', 'rotation', 'isolation', 'beginner', ARRAY['full_body']),
  ('Dead Bug', 'core', 'core', '{}', 'bodyweight', 'isolation', 'isolation', 'beginner', ARRAY['full_body']),
  ('Pallof Press', 'core', 'core', ARRAY['shoulders'], 'cable', 'isolation', 'isolation', 'beginner', ARRAY['full_body']),
  ('Side Plank', 'core', 'core', ARRAY['obliques'], 'bodyweight', 'isolation', 'isolation', 'beginner', ARRAY['full_body']),
  ('Bicycle Crunch', 'core', 'core', '{}', 'bodyweight', 'isolation', 'isolation', 'beginner', ARRAY['full_body']),
  ('Decline Sit-Up', 'core', 'core', '{}', 'bodyweight', 'isolation', 'isolation', 'beginner', ARRAY['full_body']),
  ('Wood Chop', 'core', 'core', ARRAY['shoulders'], 'cable', 'rotation', 'isolation', 'beginner', ARRAY['full_body']),
  ('Dragon Flag', 'core', 'core', ARRAY['hip flexors'], 'bodyweight', 'isolation', 'isolation', 'advanced', ARRAY['full_body']),
  ('Hollow Body Hold', 'core', 'core', '{}', 'bodyweight', 'isolation', 'isolation', 'intermediate', ARRAY['full_body']),

  -- QUADS
  ('Goblet Squat', 'quads', 'quads', ARRAY['glutes', 'core'], 'dumbbell', 'squat', 'compound', 'beginner', ARRAY['legs', 'lower', 'full_body']),
  ('Leg Press (Single Leg)', 'quads', 'quads', ARRAY['glutes'], 'machine', 'squat', 'compound', 'intermediate', ARRAY['legs', 'lower']),
  ('Sissy Squat', 'quads', 'quads', '{}', 'bodyweight', 'squat', 'isolation', 'advanced', ARRAY['legs', 'lower']),
  ('Step-Up', 'quads', 'quads', ARRAY['glutes', 'hamstrings'], 'dumbbell', 'lunge', 'compound', 'beginner', ARRAY['legs', 'lower']),
  ('Smith Machine Squat', 'quads', 'quads', ARRAY['glutes'], 'machine', 'squat', 'compound', 'beginner', ARRAY['legs', 'lower']),
  ('Box Squat', 'quads', 'quads', ARRAY['glutes', 'hamstrings'], 'barbell', 'squat', 'compound', 'intermediate', ARRAY['legs', 'lower']),
  ('Pistol Squat', 'quads', 'quads', ARRAY['glutes', 'core'], 'bodyweight', 'squat', 'compound', 'advanced', ARRAY['legs', 'lower']),
  ('Belt Squat', 'quads', 'quads', ARRAY['glutes'], 'machine', 'squat', 'compound', 'intermediate', ARRAY['legs', 'lower']),

  -- HAMSTRINGS
  ('Nordic Curl', 'hamstrings', 'hamstrings', ARRAY['glutes'], 'bodyweight', 'isolation', 'isolation', 'advanced', ARRAY['legs', 'lower']),
  ('Good Morning', 'hamstrings', 'hamstrings', ARRAY['back', 'glutes'], 'barbell', 'hinge', 'compound', 'intermediate', ARRAY['legs', 'lower', 'pull']),
  ('Stiff-Leg Deadlift', 'hamstrings', 'hamstrings', ARRAY['glutes', 'back'], 'barbell', 'hinge', 'compound', 'intermediate', ARRAY['legs', 'lower', 'pull']),
  ('Glute-Ham Raise', 'hamstrings', 'hamstrings', ARRAY['glutes'], 'machine', 'isolation', 'isolation', 'intermediate', ARRAY['legs', 'lower']),
  ('Single-Leg RDL', 'hamstrings', 'hamstrings', ARRAY['glutes', 'core'], 'dumbbell', 'hinge', 'compound', 'intermediate', ARRAY['legs', 'lower']),
  ('Lying Leg Curl', 'hamstrings', 'hamstrings', '{}', 'machine', 'isolation', 'isolation', 'beginner', ARRAY['legs', 'lower']),
  ('Seated Leg Curl', 'hamstrings', 'hamstrings', '{}', 'machine', 'isolation', 'isolation', 'beginner', ARRAY['legs', 'lower']),
  ('Cable Pull-Through', 'hamstrings', 'hamstrings', ARRAY['glutes'], 'cable', 'hinge', 'compound', 'beginner', ARRAY['legs', 'lower']),

  -- GLUTES
  ('Glute Bridge', 'glutes', 'glutes', ARRAY['hamstrings', 'core'], 'bodyweight', 'hinge', 'compound', 'beginner', ARRAY['legs', 'lower']),
  ('Cable Kickback', 'glutes', 'glutes', '{}', 'cable', 'isolation', 'isolation', 'beginner', ARRAY['legs', 'lower']),
  ('Sumo Deadlift', 'glutes', 'glutes', ARRAY['quads', 'hamstrings', 'back'], 'barbell', 'hinge', 'compound', 'intermediate', ARRAY['legs', 'lower', 'pull', 'full_body']),
  ('Frog Pump', 'glutes', 'glutes', '{}', 'bodyweight', 'isolation', 'isolation', 'beginner', ARRAY['legs', 'lower']),
  ('Banded Clamshell', 'glutes', 'glutes', '{}', 'band', 'isolation', 'isolation', 'beginner', ARRAY['legs', 'lower']),
  ('Step-Down', 'glutes', 'glutes', ARRAY['quads'], 'bodyweight', 'lunge', 'compound', 'beginner', ARRAY['legs', 'lower']),
  ('Reverse Hyper', 'glutes', 'glutes', ARRAY['hamstrings', 'back'], 'machine', 'hinge', 'compound', 'intermediate', ARRAY['legs', 'lower']),
  ('Curtsy Lunge', 'glutes', 'glutes', ARRAY['quads', 'hamstrings'], 'dumbbell', 'lunge', 'compound', 'beginner', ARRAY['legs', 'lower']),

  -- CALVES
  ('Standing Calf Raise', 'calves', 'calves', '{}', 'machine', 'isolation', 'isolation', 'beginner', ARRAY['legs', 'lower']),
  ('Seated Calf Raise', 'calves', 'calves', '{}', 'machine', 'isolation', 'isolation', 'beginner', ARRAY['legs', 'lower']),
  ('Donkey Calf Raise', 'calves', 'calves', '{}', 'machine', 'isolation', 'isolation', 'beginner', ARRAY['legs', 'lower']),
  ('Single-Leg Calf Raise', 'calves', 'calves', '{}', 'bodyweight', 'isolation', 'isolation', 'beginner', ARRAY['legs', 'lower']),
  ('Smith Machine Calf Raise', 'calves', 'calves', '{}', 'machine', 'isolation', 'isolation', 'beginner', ARRAY['legs', 'lower']),
  ('Jump Rope', 'calves', 'calves', ARRAY['cardio'], 'bodyweight', 'cardio', 'compound', 'beginner', ARRAY['cardio', 'full_body']),

  -- TRAPS
  ('Barbell Shrug', 'traps', 'traps', '{}', 'barbell', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Dumbbell Shrug', 'traps', 'traps', '{}', 'dumbbell', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Trap Bar Shrug', 'traps', 'traps', '{}', 'barbell', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Cable Shrug', 'traps', 'traps', '{}', 'cable', 'isolation', 'isolation', 'beginner', ARRAY['pull', 'upper']),
  ('Behind-the-Back Shrug', 'traps', 'traps', '{}', 'barbell', 'isolation', 'isolation', 'intermediate', ARRAY['pull', 'upper']),
  ('Power Clean', 'traps', 'traps', ARRAY['quads', 'glutes', 'shoulders'], 'barbell', 'hinge', 'compound', 'advanced', ARRAY['full_body', 'pull']),

  -- NECK
  ('Neck Flexion', 'neck', 'neck', '{}', 'bodyweight', 'isolation', 'isolation', 'beginner', ARRAY['full_body']),
  ('Neck Extension', 'neck', 'neck', '{}', 'bodyweight', 'isolation', 'isolation', 'beginner', ARRAY['full_body']),
  ('Neck Lateral Flexion', 'neck', 'neck', '{}', 'bodyweight', 'isolation', 'isolation', 'beginner', ARRAY['full_body']),
  ('Weighted Neck Harness', 'neck', 'neck', '{}', 'bodyweight', 'isolation', 'isolation', 'intermediate', ARRAY['full_body']),
  ('Neck Bridge', 'neck', 'neck', ARRAY['core'], 'bodyweight', 'isolation', 'isolation', 'advanced', ARRAY['full_body']),

  -- CARDIO
  ('Treadmill Run', 'cardio', 'cardio', ARRAY['quads', 'calves'], 'cardio_machine', 'cardio', 'compound', 'beginner', ARRAY['cardio', 'full_body']),
  ('Stationary Bike', 'cardio', 'cardio', ARRAY['quads'], 'cardio_machine', 'cardio', 'compound', 'beginner', ARRAY['cardio', 'full_body']),
  ('Rowing Machine', 'cardio', 'cardio', ARRAY['back', 'legs'], 'cardio_machine', 'cardio', 'compound', 'beginner', ARRAY['cardio', 'full_body']),
  ('Elliptical', 'cardio', 'cardio', ARRAY['quads', 'glutes'], 'cardio_machine', 'cardio', 'compound', 'beginner', ARRAY['cardio', 'full_body']),
  ('Stair Climber', 'cardio', 'cardio', ARRAY['quads', 'glutes'], 'cardio_machine', 'cardio', 'compound', 'beginner', ARRAY['cardio', 'full_body']),
  ('Battle Ropes', 'cardio', 'cardio', ARRAY['shoulders', 'core'], 'bodyweight', 'cardio', 'compound', 'intermediate', ARRAY['cardio', 'full_body']),
  ('Burpee', 'cardio', 'cardio', ARRAY['chest', 'quads', 'core'], 'bodyweight', 'cardio', 'compound', 'intermediate', ARRAY['cardio', 'full_body']),
  ('Box Jump', 'cardio', 'cardio', ARRAY['quads', 'glutes'], 'bodyweight', 'cardio', 'compound', 'intermediate', ARRAY['cardio', 'full_body']),
  ('Sled Push', 'cardio', 'cardio', ARRAY['quads', 'glutes', 'calves'], 'bodyweight', 'cardio', 'compound', 'intermediate', ARRAY['cardio', 'full_body']),
  ('Assault Bike', 'cardio', 'cardio', ARRAY['quads', 'shoulders'], 'cardio_machine', 'cardio', 'compound', 'intermediate', ARRAY['cardio', 'full_body']),
  ('Swimming', 'cardio', 'cardio', ARRAY['back', 'shoulders'], 'bodyweight', 'cardio', 'compound', 'beginner', ARRAY['cardio', 'full_body']),
  ('Jumping Jacks', 'cardio', 'cardio', ARRAY['calves'], 'bodyweight', 'cardio', 'compound', 'beginner', ARRAY['cardio', 'full_body']),

  -- FULL BODY
  ('Clean and Press', 'full_body', 'full_body', ARRAY['shoulders', 'quads', 'back'], 'barbell', 'hinge', 'compound', 'advanced', ARRAY['full_body']),
  ('Thruster', 'full_body', 'full_body', ARRAY['quads', 'shoulders'], 'barbell', 'squat', 'compound', 'intermediate', ARRAY['full_body']),
  ('Kettlebell Swing', 'full_body', 'full_body', ARRAY['glutes', 'hamstrings', 'core'], 'kettlebell', 'hinge', 'compound', 'intermediate', ARRAY['full_body']),
  ('Turkish Get-Up', 'full_body', 'full_body', ARRAY['shoulders', 'core'], 'kettlebell', 'carry', 'compound', 'advanced', ARRAY['full_body']),
  ('Man Maker', 'full_body', 'full_body', ARRAY['chest', 'back', 'shoulders'], 'dumbbell', 'compound', 'compound', 'advanced', ARRAY['full_body']),
  ('Bear Crawl', 'full_body', 'full_body', ARRAY['core', 'shoulders'], 'bodyweight', 'carry', 'compound', 'intermediate', ARRAY['full_body']),
  ('Wall Ball', 'full_body', 'full_body', ARRAY['quads', 'shoulders'], 'bodyweight', 'squat', 'compound', 'intermediate', ARRAY['full_body']),
  ('Devil Press', 'full_body', 'full_body', ARRAY['chest', 'shoulders', 'quads'], 'dumbbell', 'compound', 'compound', 'advanced', ARRAY['full_body']),
  ('Trap Bar Deadlift', 'full_body', 'full_body', ARRAY['quads', 'glutes', 'back'], 'barbell', 'hinge', 'compound', 'intermediate', ARRAY['full_body', 'legs', 'pull']),
  ('Medicine Ball Slam', 'full_body', 'full_body', ARRAY['core', 'shoulders'], 'bodyweight', 'hinge', 'compound', 'beginner', ARRAY['full_body', 'cardio'])
) AS v(name, body_part, muscle_group, secondary_muscle_groups, equipment, movement_pattern, movement_type, difficulty, split_tags)
WHERE NOT EXISTS (
  SELECT 1 FROM exercise_library el
  WHERE el.user_id IS NULL AND lower(el.name) = lower(v.name)
);
