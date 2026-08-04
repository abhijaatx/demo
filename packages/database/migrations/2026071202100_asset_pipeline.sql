-- UP Migration: Add asset validation, quarantine, processing, derivatives, quotas, and references
-- TASK-044: Validation and quarantine columns
-- TASK-045/046: Processing columns and derivatives table
-- TASK-048: Quota tracking and reference counting

-- Extend workspace_assets with new status columns
ALTER TABLE workspace_assets
  ADD COLUMN IF NOT EXISTS thumbnail_path text,
  ADD COLUMN IF NOT EXISTS quarantine_reason text,
  ADD COLUMN IF NOT EXISTS rejection_code text,
  ADD COLUMN IF NOT EXISTS processing_job_id text,
  ADD COLUMN IF NOT EXISTS reference_count integer NOT NULL DEFAULT 0;

-- Quarantine reason check (allow any text; rejection_code is validated at app layer)
ALTER TABLE workspace_assets
  ADD CONSTRAINT workspace_assets_reference_count_nonneg
    CHECK (reference_count >= 0);

-- Asset derivatives table (thumbnails, transcoded variants, waveforms, poster frames)
CREATE TABLE IF NOT EXISTS asset_derivatives (
  id uuid PRIMARY KEY,
  asset_id uuid NOT NULL REFERENCES workspace_assets(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kind text NOT NULL,
  mime_type text NOT NULL,
  storage_path text NOT NULL UNIQUE,
  size_in_bytes bigint NOT NULL,
  width integer,
  height integer,
  duration_seconds numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS asset_derivatives_asset_idx
  ON asset_derivatives (asset_id);

CREATE INDEX IF NOT EXISTS asset_derivatives_workspace_kind_idx
  ON asset_derivatives (workspace_id, kind);

-- Asset references: tracks which demos reference which assets
CREATE TABLE IF NOT EXISTS asset_references (
  asset_id uuid NOT NULL REFERENCES workspace_assets(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  demo_id uuid NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (asset_id, demo_id)
);

CREATE INDEX IF NOT EXISTS asset_references_asset_idx
  ON asset_references (asset_id);

CREATE INDEX IF NOT EXISTS asset_references_workspace_idx
  ON asset_references (workspace_id);

-- Workspace asset quotas: configurable per-workspace limits
CREATE TABLE IF NOT EXISTS workspace_asset_quotas (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  storage_limit_bytes bigint NOT NULL DEFAULT 10737418240, -- 10 GB default
  asset_count_limit integer NOT NULL DEFAULT 10000,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- View for convenient quota calculation
CREATE OR REPLACE VIEW workspace_asset_usage AS
  SELECT
    w.id AS workspace_id,
    COALESCE(SUM(a.size_in_bytes), 0) AS total_storage_used_bytes,
    COUNT(a.id) AS asset_count
  FROM workspaces w
  LEFT JOIN workspace_assets a
    ON a.workspace_id = w.id
    AND a.status NOT IN ('deleted', 'quarantined', 'failed')
    AND a.deleted_at IS NULL
  GROUP BY w.id;

-- Update status index to cover new statuses
DROP INDEX IF EXISTS workspace_assets_tenant_idx;
CREATE INDEX IF NOT EXISTS workspace_assets_tenant_status_idx
  ON workspace_assets (workspace_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- Index for processing job lookups
CREATE INDEX IF NOT EXISTS workspace_assets_processing_job_idx
  ON workspace_assets (processing_job_id)
  WHERE processing_job_id IS NOT NULL;

-- DOWN Migration
-- DROP VIEW IF EXISTS workspace_asset_usage;
-- DROP TABLE IF EXISTS workspace_asset_quotas;
-- DROP TABLE IF EXISTS asset_references;
-- DROP TABLE IF EXISTS asset_derivatives;
-- ALTER TABLE workspace_assets
--   DROP COLUMN IF EXISTS thumbnail_path,
--   DROP COLUMN IF EXISTS quarantine_reason,
--   DROP COLUMN IF EXISTS rejection_code,
--   DROP COLUMN IF EXISTS processing_job_id,
--   DROP COLUMN IF EXISTS reference_count;
