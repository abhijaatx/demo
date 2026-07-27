-- Up Migration

ALTER TABLE demo_audit_events ALTER COLUMN demo_id DROP NOT NULL;
ALTER TABLE demo_audit_events DROP CONSTRAINT IF EXISTS demo_audit_events_check;
ALTER TABLE demo_audit_events DROP CONSTRAINT IF EXISTS demo_audit_events_action_check;

ALTER TABLE demo_audit_events
  ADD CONSTRAINT demo_audit_events_action_check CHECK (action IN (
    'demo.created',
    'demo.updated',
    'demo.status_changed',
    'demo.deleted',
    'demo.restored',
    'demo.archived',
    'demo.unarchived',
    'demo.permanently_deleted'
  ));

ALTER TABLE demo_audit_events
  DROP CONSTRAINT IF EXISTS demo_audit_events_demo_id_fkey;

ALTER TABLE demo_audit_events
  ADD CONSTRAINT demo_audit_events_demo_id_fkey
    FOREIGN KEY (demo_id) REFERENCES demos (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS demos_workspace_trash_list_idx
  ON demos (workspace_id, deleted_at DESC, id DESC)
  WHERE deleted_at IS NOT NULL;

-- Down Migration

DROP INDEX IF EXISTS demos_workspace_trash_list_idx;

ALTER TABLE demo_audit_events
  DROP CONSTRAINT IF EXISTS demo_audit_events_demo_id_fkey;

ALTER TABLE demo_audit_events
  ADD CONSTRAINT demo_audit_events_demo_id_fkey
    FOREIGN KEY (demo_id) REFERENCES demos (id) ON DELETE CASCADE;

ALTER TABLE demo_audit_events DROP CONSTRAINT IF EXISTS demo_audit_events_action_check;

ALTER TABLE demo_audit_events
  ADD CONSTRAINT demo_audit_events_check CHECK (
    (action = 'demo.status_changed' AND previous_status IS NOT NULL AND status IS NOT NULL)
    OR (action = 'demo.deleted' AND previous_status IS NOT NULL AND status IS NULL)
    OR (action = 'demo.restored' AND previous_status IS NULL AND status IS NOT NULL)
    OR (action IN ('demo.created', 'demo.updated') AND previous_status IS NULL AND status IS NULL)
  );

UPDATE demo_audit_events SET demo_id = '00000000-0000-0000-0000-000000000000' WHERE demo_id IS NULL;
ALTER TABLE demo_audit_events ALTER COLUMN demo_id SET NOT NULL;
