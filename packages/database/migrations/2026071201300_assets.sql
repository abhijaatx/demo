-- UP Migration: Add workspace_assets table and index

CREATE TABLE IF NOT EXISTS workspace_assets (
  id uuid PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  uploader_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'upload_pending',
  file_name text NOT NULL,
  mime_type text NOT NULL,
  size_in_bytes bigint NOT NULL,
  storage_path text NOT NULL UNIQUE,
  checksum_sha256 text NOT NULL,
  width integer,
  height integer,
  duration_seconds numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS workspace_assets_tenant_idx
  ON workspace_assets (workspace_id, status)
  WHERE deleted_at IS NULL;

-- DOWN Migration
-- DROP INDEX IF EXISTS workspace_assets_tenant_idx;
-- DROP TABLE IF EXISTS workspace_assets;
