-- Migration: Demo Drafts, Revisions, and Snapshots (TASK-052)
-- Up Migration

CREATE TABLE IF NOT EXISTS demo_drafts (
  demo_id UUID PRIMARY KEY REFERENCES demos(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  document JSONB NOT NULL,
  revision_number BIGINT NOT NULL DEFAULT 1,
  updated_by_user_id UUID NOT NULL REFERENCES user_profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demo_drafts_tenant_idx ON demo_drafts (workspace_id);

CREATE TABLE IF NOT EXISTS demo_revisions (
  id UUID PRIMARY KEY,
  demo_id UUID NOT NULL REFERENCES demos(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  revision_number BIGINT NOT NULL,
  snapshot_json JSONB NOT NULL,
  created_by_user_id UUID NOT NULL REFERENCES user_profiles(id),
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT demo_revisions_workspace_demo_rev_unique UNIQUE (workspace_id, demo_id, revision_number)
);

CREATE INDEX IF NOT EXISTS demo_revisions_list_idx ON demo_revisions (workspace_id, demo_id, revision_number DESC);
