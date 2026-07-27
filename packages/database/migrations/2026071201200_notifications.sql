-- UP Migration: Add user_notifications table and unread index

CREATE TABLE IF NOT EXISTS user_notifications (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  target_type text NOT NULL,
  target_id uuid NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_notifications_unread_idx
  ON user_notifications (workspace_id, recipient_user_id)
  WHERE is_read = false;

-- DOWN Migration
-- DROP INDEX IF EXISTS user_notifications_unread_idx;
-- DROP TABLE IF EXISTS user_notifications;
