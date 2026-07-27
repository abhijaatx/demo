-- Up Migration

CREATE TABLE tags (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
  created_by_user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  updated_at timestamptz(3) NOT NULL DEFAULT now(),
  CONSTRAINT tags_workspace_id_id_key UNIQUE (workspace_id, id)
);

CREATE UNIQUE INDEX tags_workspace_lower_name_key ON tags (workspace_id, lower(name));

CREATE TABLE demo_tags (
  workspace_id uuid NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  demo_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, demo_id, tag_id),
  CONSTRAINT demo_tags_demo_workspace_fk
    FOREIGN KEY (workspace_id, demo_id) REFERENCES demos (workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT demo_tags_tag_workspace_fk
    FOREIGN KEY (workspace_id, tag_id) REFERENCES tags (workspace_id, id) ON DELETE CASCADE
);

CREATE TABLE tag_creation_requests (
  workspace_id uuid NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  owner_user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  idempotency_key text NOT NULL CHECK (char_length(idempotency_key) BETWEEN 1 AND 128),
  request_fingerprint text NOT NULL,
  tag_id uuid,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, owner_user_id, idempotency_key),
  CONSTRAINT tag_creation_requests_tag_workspace_fk
    FOREIGN KEY (workspace_id, tag_id) REFERENCES tags (workspace_id, id) ON DELETE RESTRICT
);

CREATE TABLE demo_tag_audit_events (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
  demo_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  action text NOT NULL CHECK (action IN ('tag.assigned', 'tag.removed')),
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  CONSTRAINT demo_tag_audit_events_demo_workspace_fk
    FOREIGN KEY (workspace_id, demo_id) REFERENCES demos (workspace_id, id) ON DELETE CASCADE,
  CONSTRAINT demo_tag_audit_events_tag_workspace_fk
    FOREIGN KEY (workspace_id, tag_id) REFERENCES tags (workspace_id, id) ON DELETE CASCADE
);

CREATE INDEX demo_tags_workspace_tag_demo_idx ON demo_tags (workspace_id, tag_id, demo_id);
CREATE INDEX demos_workspace_filter_idx
  ON demos (workspace_id, owner_user_id, type, status, updated_at DESC, id DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX demos_workspace_search_idx
  ON demos USING GIN (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, '')))
  WHERE deleted_at IS NULL;

-- Down Migration

DROP INDEX demos_workspace_search_idx;
DROP INDEX demos_workspace_filter_idx;
DROP INDEX demo_tags_workspace_tag_demo_idx;
DROP INDEX tags_workspace_lower_name_key;
DROP TABLE demo_tag_audit_events;
DROP TABLE tag_creation_requests;
DROP TABLE demo_tags;
DROP TABLE tags;
