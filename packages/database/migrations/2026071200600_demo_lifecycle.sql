-- Up Migration

CREATE TABLE demos (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  description text CHECK (description IS NULL OR char_length(description) <= 4000),
  type text NOT NULL CHECK (type IN ('guided_html', 'screenshot', 'video', 'sandbox')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'processing', 'published', 'failed', 'needs_update', 'archived'
  )),
  published_at timestamptz(3),
  deleted_at timestamptz(3),
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now()
);

CREATE INDEX demos_workspace_active_updated_idx
  ON demos (workspace_id, updated_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX demos_workspace_deleted_idx
  ON demos (workspace_id, deleted_at DESC, id DESC)
  WHERE deleted_at IS NOT NULL;

CREATE TABLE demo_creation_requests (
  workspace_id uuid NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 1 AND 128),
  request_fingerprint text NOT NULL,
  demo_id uuid REFERENCES demos (id) ON DELETE SET NULL,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, owner_user_id, idempotency_key)
);

CREATE TABLE demo_audit_events (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  demo_id uuid NOT NULL REFERENCES demos (id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN (
    'demo.created',
    'demo.updated',
    'demo.status_changed',
    'demo.deleted',
    'demo.restored'
  )),
  previous_status text CHECK (previous_status IS NULL OR previous_status IN (
    'draft', 'processing', 'published', 'failed', 'needs_update', 'archived'
  )),
  status text CHECK (status IS NULL OR status IN (
    'draft', 'processing', 'published', 'failed', 'needs_update', 'archived'
  )),
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  CHECK (
    (action = 'demo.status_changed' AND previous_status IS NOT NULL AND status IS NOT NULL)
    OR (action = 'demo.deleted' AND previous_status IS NOT NULL AND status IS NULL)
    OR (action = 'demo.restored' AND previous_status IS NULL AND status IS NOT NULL)
    OR (action IN ('demo.created', 'demo.updated') AND previous_status IS NULL AND status IS NULL)
  )
);

CREATE INDEX demo_audit_events_workspace_demo_created_idx
  ON demo_audit_events (workspace_id, demo_id, created_at DESC);

-- Down Migration

DROP INDEX demo_audit_events_workspace_demo_created_idx;
DROP TABLE demo_audit_events;
DROP TABLE demo_creation_requests;
DROP INDEX demos_workspace_deleted_idx;
DROP INDEX demos_workspace_active_updated_idx;
DROP TABLE demos;
