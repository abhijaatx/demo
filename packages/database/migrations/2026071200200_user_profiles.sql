-- Up Migration

CREATE TABLE user_profiles (
  user_id uuid PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  display_name text NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 120),
  avatar_url text,
  timezone text NOT NULL DEFAULT 'UTC' CHECK (char_length(btrim(timezone)) BETWEEN 1 AND 64),
  preferences jsonb NOT NULL DEFAULT '{"theme":"system","locale":"en-US","reducedMotion":false,"emailNotifications":true}'::jsonb,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now(),
  CONSTRAINT user_profiles_avatar_url_check CHECK (
    avatar_url IS NULL OR (
      char_length(avatar_url) BETWEEN 1 AND 2048 AND
      avatar_url ~ '^https://'
    )
  ),
  CONSTRAINT user_profiles_preferences_object_check CHECK (
    jsonb_typeof(preferences) = 'object' AND pg_column_size(preferences) <= 16384
  )
);

-- Down Migration

DROP TABLE user_profiles;
