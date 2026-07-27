-- Up Migration

ALTER TABLE organizations
  ADD COLUMN owner_user_id uuid NOT NULL REFERENCES users (id) ON DELETE RESTRICT;

CREATE INDEX organizations_owner_user_id_idx ON organizations (owner_user_id);

CREATE TABLE workspace_creation_requests (
  owner_user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  idempotency_key text NOT NULL CHECK (char_length(btrim(idempotency_key)) BETWEEN 1 AND 128),
  request_fingerprint text NOT NULL CHECK (char_length(request_fingerprint) BETWEEN 1 AND 1024),
  organization_id uuid REFERENCES organizations (id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces (id) ON DELETE CASCADE,
  created_at timestamptz(3) NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_user_id, idempotency_key),
  CONSTRAINT workspace_creation_requests_result_pair_check CHECK (
    (organization_id IS NULL AND workspace_id IS NULL) OR
    (organization_id IS NOT NULL AND workspace_id IS NOT NULL)
  )
);

-- Down Migration

DROP TABLE workspace_creation_requests;
DROP INDEX organizations_owner_user_id_idx;
ALTER TABLE organizations DROP COLUMN owner_user_id;
