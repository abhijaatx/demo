-- Up Migration

CREATE TABLE workspace_audit_events (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  target_user_id uuid REFERENCES users (id) ON DELETE SET NULL,
  invitation_id uuid REFERENCES workspace_invitations (id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN (
    'member.invited',
    'member.role_changed',
    'member.removed',
    'invitation.revoked'
  )),
  created_at timestamptz(3) NOT NULL DEFAULT now()
);

CREATE INDEX workspace_audit_events_workspace_created_idx
  ON workspace_audit_events (workspace_id, created_at DESC);

-- Down Migration

DROP INDEX workspace_audit_events_workspace_created_idx;
DROP TABLE workspace_audit_events;
