-- UP Migration: Add upload_sessions and upload_parts tables for multipart uploads

CREATE TABLE IF NOT EXISTS upload_sessions (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  uploader_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  mime_type text NOT NULL,
  total_size_in_bytes bigint NOT NULL,
  checksum_sha256 text NOT NULL,
  storage_key text NOT NULL,
  provider_upload_id text,
  status text NOT NULL DEFAULT 'pending',
  part_count integer NOT NULL,
  part_size_in_bytes bigint NOT NULL,
  completed_part_count integer NOT NULL DEFAULT 0,
  asset_id uuid REFERENCES workspace_assets(id) ON DELETE SET NULL,
  idempotency_key text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT upload_sessions_idempotency_uidx
    UNIQUE (workspace_id, idempotency_key)
);

-- Tenant index for session lookups by workspace + uploader
CREATE INDEX IF NOT EXISTS upload_sessions_tenant_idx
  ON upload_sessions (workspace_id, uploader_user_id, status)
  WHERE status IN ('pending', 'finalizing');

-- Upload parts track which part numbers have been confirmed uploaded
CREATE TABLE IF NOT EXISTS upload_parts (
  session_id uuid NOT NULL REFERENCES upload_sessions(id) ON DELETE CASCADE,
  part_number integer NOT NULL,
  etag text,
  size_in_bytes bigint,
  uploaded_at timestamptz,
  PRIMARY KEY (session_id, part_number)
);

-- DOWN Migration
-- DROP TABLE IF EXISTS upload_parts;
-- DROP INDEX IF EXISTS upload_sessions_tenant_idx;
-- DROP TABLE IF EXISTS upload_sessions;
