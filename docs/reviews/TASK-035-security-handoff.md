# Security Review & Handoff — TASK-035: Archive, Trash, Restore, and Permanent Deletion

## Overview

- **Task**: TASK-035 — Add archive, trash, restore, and permanent deletion
- **Status**: Completed & Verified
- **Scope**: `@supademo/domain`, `@supademo/database`, `apps/worker`, `@supademo/api`, `@supademo/web`

---

## Technical Changes & Architecture

### 1. Domain Layer (`packages/domain`)

- **Types & Retention**: Added `TrashItem` type and `calculateTrashRetention` helper function. `TRASH_RETENTION_DAYS` is set to 30.
- **Audit Actions**: Updated `DemoAuditAction` union with `demo.archived`, `demo.unarchived`, and `demo.permanently_deleted`.
- **Repository Interface**: Updated `DemoRepository` interface with `listTrash`, `archive`, `unarchive`, and `permanentDelete`.

### 2. Database Layer (`packages/database`)

- **Migration `2026071200900_trash_and_permanent_deletion.sql`**:
  - Modified `demo_audit_events.demo_id` foreign key constraint to `ON DELETE SET NULL` and made column nullable so audit records remain intact after permanent demo deletion.
  - Added new audit action check constraints and created index `demos_workspace_trash_list_idx`.
- **Repository Methods**:
  - `listTrash`: Lists soft-deleted demos for active workspace, mapping retention calculation.
  - `archive` / `unarchive`: Enforces `demo:update` capability, verifies state transition rules, and emits audit events.
  - `softDelete` / `restore`: Implemented idempotently for soft-deleting and restoring demos.
  - `permanentDelete`: Enforces `demo:delete` capability, requires demo to be in trash first (throws `DemoConflictError` if active), hard-deletes demo row, and records `demo.permanently_deleted` audit event.
  - `purgeExpiredTrash`: Queries trashed demos older than specified retention window (default 30 days), logs permanent deletion audit events, and purges database rows.

### 3. Worker Layer (`apps/worker`)

- **Purge Background Job**: Created `createPurgeTrashJobHandler` and registered `demo.purge_trash` job handler in queue worker.

### 4. API & OpenAPI Contracts (`apps/api` & `@supademo/web`)

- **Endpoints**: Added `/trash`, `/archive`, `/unarchive`, and `/permanent` routes under `/api/v1/workspaces/{workspaceId}/demos`.
- **OpenAPI**: Registered `TrashItemSchema` and contract paths in `apps/api/src/openapi.ts`, regenerated `openapi.json` and TypeScript client definitions in `apps/web/src/generated/api.ts`.
- **Web Client**: Updated `DemoClient` with `listTrash`, `archive`, `unarchive`, `softDelete`, `restore`, and `permanentDelete`.

### 5. Creator Dashboard UI (`apps/web/components/demo-dashboard-screen.tsx`)

- **Card & Row Actions**: Added Archive, Unarchive, and Move to Trash controls to `DemoCard` and `DemoListRow`.
- **Trash View**: Added "Trash" tree item in sidebar displaying item count. When selected, displays trashed demos with 30-day retention countdown indicator ("Permanently deletes in X days").
- **Restore & Permanent Delete**: Trashed items feature Restore and Delete Permanently actions.
- **Explicit Destructive Confirmation**: Clicking Delete Permanently opens a destructive confirmation modal explicitly naming the target demo and stating consequence ("This action is permanent and cannot be undone.").

---

## Security Analysis & Controls

1. **Authorization & Tenant Boundary Preservation**:
   - All operations (`listTrash`, `archive`, `unarchive`, `softDelete`, `restore`, `permanentDelete`) re-verify workspace membership and role capabilities on the server side (`demo:update` for status/archive, `demo:delete` for soft-delete, restore, and permanent deletion).
   - SQL queries parameterize `workspace_id = $2` on all lookup, update, and delete queries, preventing cross-tenant unauthorized data access or deletion.

2. **Idempotency & Replay Protection**:
   - Soft-deleting an already trashed demo returns `true` idempotently.
   - Restoring an already active demo returns the active demo object idempotently.
   - Permanently deleting a non-existent demo in the workspace returns `true` idempotently.

3. **Audit Trail Preservation**:
   - Audit events are logged for all lifecycle transitions (`demo.archived`, `demo.unarchived`, `demo.deleted`, `demo.restored`, `demo.permanently_deleted`).
   - `ON DELETE SET NULL` constraint ensures historical audit event logs remain accessible even after permanent hard deletion of the demo entity.

4. **UI Safety**:
   - Destructive deletion cannot be triggered accidentally; requires explicit confirmation modal.

---

## Verification Summary

- `npm run verify`: Passed (formatting, linting, workspace boundaries, TypeScript checks all green).
- `npm test`: Passed (128 tests passing across unit, API, database, and repository test suites).
- `npm audit --audit-level=high`: Verified.
