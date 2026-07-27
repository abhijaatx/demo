-- UP Migration: Add demo_comments table, indexes, and audit actions

CREATE TABLE IF NOT EXISTS demo_comments (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  target_type text NOT NULL CHECK (target_type IN ('demo', 'step')),
  target_id uuid NOT NULL,
  thread_id uuid NOT NULL,
  parent_id uuid REFERENCES demo_comments(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  mentions jsonb NOT NULL DEFAULT '[]'::jsonb,
  reactions jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_by_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS demo_comments_workspace_target_idx
  ON demo_comments (workspace_id, target_type, target_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS demo_comments_workspace_thread_idx
  ON demo_comments (workspace_id, thread_id)
  WHERE deleted_at IS NULL;

ALTER TABLE demo_audit_events
  DROP CONSTRAINT IF EXISTS demo_audit_events_action_check;

ALTER TABLE demo_audit_events
  ADD CONSTRAINT demo_audit_events_action_check
  CHECK (
    action IN (
      'demo.created',
      'demo.updated',
      'demo.status_changed',
      'demo.deleted',
      'demo.restored',
      'demo.archived',
      'demo.unarchived',
      'demo.permanently_deleted',
      'demo.duplicated',
      'demo.template_designated',
      'demo.template_created',
      'comment.created',
      'comment.updated',
      'comment.deleted',
      'comment.resolved',
      'comment.reopened',
      'comment.reaction_added',
      'comment.reaction_removed'
    )
  );

-- DOWN Migration
-- DROP INDEX IF EXISTS demo_comments_workspace_thread_idx;
-- DROP INDEX IF EXISTS demo_comments_workspace_target_idx;
-- DROP TABLE IF EXISTS demo_comments;
