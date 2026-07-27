-- Up Migration

CREATE TABLE folders (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  parent_id uuid,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_by_user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now(),
  CONSTRAINT folders_workspace_id_id_key UNIQUE (workspace_id, id),
  CONSTRAINT folders_parent_workspace_fk
    FOREIGN KEY (workspace_id, parent_id)
    REFERENCES folders (workspace_id, id)
    DEFERRABLE INITIALLY IMMEDIATE
);

CREATE INDEX folders_workspace_parent_name_idx
  ON folders (workspace_id, COALESCE(parent_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(name));

CREATE INDEX folders_workspace_parent_idx ON folders (workspace_id, parent_id, name, id);

ALTER TABLE demos ADD COLUMN folder_id uuid;
ALTER TABLE demos
  ADD CONSTRAINT demos_folder_workspace_fk
  FOREIGN KEY (workspace_id, folder_id)
  REFERENCES folders (workspace_id, id)
  DEFERRABLE INITIALLY IMMEDIATE;

CREATE INDEX demos_workspace_folder_active_updated_idx
  ON demos (workspace_id, folder_id, updated_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE folder_creation_requests (
  workspace_id uuid NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 1 AND 128),
  request_fingerprint text NOT NULL,
  folder_id uuid REFERENCES folders (id) ON DELETE SET NULL,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, owner_user_id, idempotency_key)
);

CREATE TABLE folder_audit_events (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  folder_id uuid NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('folder.created', 'folder.renamed', 'folder.moved', 'folder.deleted')),
  previous_parent_id uuid,
  parent_id uuid,
  created_at timestamptz(3) NOT NULL DEFAULT now()
);

CREATE INDEX folder_audit_events_workspace_folder_created_idx
  ON folder_audit_events (workspace_id, folder_id, created_at DESC);

-- Folder deletion is application-controlled: direct child folders are promoted and
-- direct demos are moved to the deleted folder's parent in one transaction.

-- Down Migration

DROP INDEX folder_audit_events_workspace_folder_created_idx;
DROP TABLE folder_audit_events;
DROP TABLE folder_creation_requests;
DROP INDEX demos_workspace_folder_active_updated_idx;
ALTER TABLE demos DROP CONSTRAINT demos_folder_workspace_fk;
ALTER TABLE demos DROP COLUMN folder_id;
DROP INDEX folders_workspace_parent_idx;
DROP INDEX folders_workspace_parent_name_idx;
DROP TABLE folders;
