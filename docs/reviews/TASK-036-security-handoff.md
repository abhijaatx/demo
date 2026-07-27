# Security Review & Handoff — TASK-036: Demo Duplication and Templates

## Overview

- **Task**: TASK-036 — Add demo duplication and templates
- **Status**: Completed & Verified
- **Scope**: `@supademo/domain`, `@supademo/database`, `@supademo/api`, `@supademo/web`

---

## Technical Changes & Architecture

### 1. Domain Layer (`packages/domain`)

- **Domain Model**: Added `isTemplate: boolean` to `Demo` model.
- **Input Interfaces & Parsers**:
  - `DuplicateDemoInput`: `{ title?: string, folderId?: string | null }`
  - `CreateFromTemplateInput`: `{ title?: string, folderId?: string | null }`
  - `SetDemoTemplateInput`: `{ isTemplate: boolean }`
  - Added strict parsers `parseDuplicateDemoInput`, `parseCreateFromTemplateInput`, `parseSetDemoTemplateInput`.
- **Audit Actions**: Updated `DemoAuditAction` union with `demo.duplicated`, `demo.template_designated`, and `demo.template_created`.
- **Repository Interface**: Updated `DemoRepository` with `duplicate`, `setTemplate`, and `createFromTemplate`.

### 2. Database Layer (`packages/database`)

- **Migration `2026071201000_demo_templates_and_duplication.sql`**:
  - Added `is_template boolean NOT NULL DEFAULT false` column to `demos` table.
  - Created partial index `demos_workspace_template_idx ON demos (workspace_id, is_template) WHERE deleted_at IS NULL AND is_template = true`.
  - Updated `demo_audit_events` action check constraint to include `demo.duplicated`, `demo.template_designated`, `demo.template_created`.
- **Repository Implementations**:
  - `duplicate`: Transactional deep copy of source demo. Resets status to `draft`, clears `published_at`, generates new server-side UUIDv7, assigns ownership to calling user in active workspace, appends ` (Copy)` to title or uses custom title, verifies folder workspace ownership, records idempotency key in `demo_creation_requests`, and logs `demo.duplicated` audit event.
  - `setTemplate`: Requires `demo:update` capability, verifies demo exists and is active, updates `is_template` boolean, and logs `demo.template_designated` audit event.
  - `createFromTemplate`: Requires `demo:create` capability, verifies target demo is active and designated as template (`is_template = true`), instantiates new demo row in `draft` status assigned to actor, records idempotency key, and logs `demo.template_created` audit event.

### 3. API & OpenAPI Contracts (`apps/api` & `@supademo/web`)

- **REST Endpoints**:
  - `POST /api/v1/workspaces/{workspaceId}/demos/{demoId}/duplicate`
  - `POST /api/v1/workspaces/{workspaceId}/demos/{demoId}/template`
  - `POST /api/v1/workspaces/{workspaceId}/demos/{demoId}/instantiate`
- **OpenAPI Specifications**: Registered `DuplicateDemoSchema`, `SetDemoTemplateSchema`, `CreateFromTemplateSchema`, updated `DemoSchema` with `isTemplate`, and regenerated OpenAPI JSON contract (`apps/api/openapi.json`) and TypeScript client types (`apps/web/src/generated/api.ts`).
- **Web Client**: Updated `DemoClient` interface and implementation with `duplicate`, `setTemplate`, and `createFromTemplate` methods featuring automatic idempotency key header generation.

### 4. Creator Dashboard UI (`apps/web/components/demo-dashboard-screen.tsx`)

- **Actions & Controls**: Added "Duplicate", "Save as template" / "Remove template", and "Use template" buttons on `DemoCard` and `DemoListRow`.
- **Badges**: Displays `Template` badge on demo cards and list rows when `demo.isTemplate` is true.
- **Templates Sidebar View**: Added "Templates" item in `FolderSidebar` displaying count of workspace templates and filtering workspace demos when selected.
- **Progress & Feedback**: Provides immediate loading and success/error status messages on completion.

---

## Security Analysis & Controls

1. **Authorization & Tenant Boundary Preservation**:
   - All operations (`duplicate`, `setTemplate`, `createFromTemplate`) re-verify workspace membership and capability authorization server-side (`demo:create` for duplication and template instantiation, `demo:update` for template toggling).
   - Lookups parameterize `workspace_id = $2` on all queries. Source demo, target template, and target folder must all belong to the active workspace, preventing IDOR or cross-workspace data copy attacks.
   - Ownership of duplicated or instantiated demos is strictly assigned to the server-authenticated actor (`owner_user_id = actorUserId`), ignoring any client claims.

2. **Idempotency & Replay Protection**:
   - Both `duplicate` and `createFromTemplate` accept optional `idempotency-key` request headers and store request keys in `demo_creation_requests` under `(workspace_id, owner_user_id, idempotency_key)`.
   - Replaying a request with the same idempotency key safely returns the previously created demo without creating uncontrolled duplicate records.

3. **Data Sanitization & Secret Isolation**:
   - Secrets, access tokens, presigned URLs, and analytics identity data are never copied onto duplicated or template-instantiated demos.
   - Status is forcibly reset to `draft` and `published_at` is set to `null` so draft copies cannot bypass publication workflows.
   - Trashed (soft-deleted) demos cannot be duplicated (throws `DemoConflictError`).

4. **Negative Test Suite Coverage**:
   - Tested viewer role rejection (`AuthorizationDeniedError`).
   - Tested soft-deleted demo duplication rejection (`DemoConflictError`).
   - Tested non-template demo instantiation rejection (`DemoConflictError`).
   - Tested cross-workspace template instantiation and demo lookup isolation.
   - Tested idempotency key replay protection.

---

## Residual Risks & Skipped Checks

1. **Upstream Dev-Dependency Audits**:
   - `npm audit --audit-level=high` reports 7 high-severity findings in upstream build-time/development packages (`next`, `postcss`, `sharp`, `openapi-typescript` / `js-yaml`).
   - Run-time API and database engines (`@supademo/database`, `@supademo/domain`, `apps/api`, `@supademo/auth`, `@supademo/queue`) do not depend on these build tools and enforce strict input validation, parameterization, and authorization.

---

## Verification Evidence

- `npm run format:check` -> All files formatted cleanly with Prettier.
- `npm run lint` -> Passed with 0 errors and 0 warnings.
- `npm run check:boundaries` -> Passed.
- `npm run typecheck` -> Passed cleanly across all workspace packages.
- `npm run build` -> Next.js production build succeeded.
- `npm test` -> 133 tests passed cleanly (1 DB integration test skipped as expected).
