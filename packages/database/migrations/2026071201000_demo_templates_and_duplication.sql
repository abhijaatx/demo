-- UP Migration: Add is_template column, template index, and duplication audit actions

ALTER TABLE demos
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS demos_workspace_template_idx
  ON demos (workspace_id, is_template)
  WHERE deleted_at IS NULL AND is_template = true;

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
      'demo.template_created'
    )
  );

-- DOWN Migration
-- DROP INDEX IF EXISTS demos_workspace_template_idx;
-- ALTER TABLE demos DROP COLUMN IF EXISTS is_template;
