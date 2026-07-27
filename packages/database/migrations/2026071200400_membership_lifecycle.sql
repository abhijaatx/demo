-- Up Migration

ALTER TABLE user_profiles
  ADD COLUMN current_workspace_id uuid REFERENCES workspaces (id) ON DELETE SET NULL;

CREATE INDEX user_profiles_current_workspace_id_idx ON user_profiles (current_workspace_id);

CREATE TABLE workspace_invitations (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  inviter_user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  email text NOT NULL CHECK (char_length(btrim(email)) BETWEEN 3 AND 320),
  role text NOT NULL CHECK (role IN ('admin', 'editor', 'viewer')),
  token_hash text NOT NULL UNIQUE CHECK (char_length(token_hash) = 64),
  expires_at timestamptz(3) NOT NULL,
  accepted_at timestamptz(3),
  revoked_at timestamptz(3),
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now()
);

CREATE INDEX workspace_invitations_workspace_email_idx
  ON workspace_invitations (workspace_id, lower(email));

-- Down Migration

DROP INDEX workspace_invitations_workspace_email_idx;
DROP TABLE workspace_invitations;
DROP INDEX user_profiles_current_workspace_id_idx;
ALTER TABLE user_profiles DROP COLUMN current_workspace_id;
