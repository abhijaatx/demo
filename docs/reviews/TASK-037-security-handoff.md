# Security Review & Handoff — TASK-037: Comments Domain and APIs

## Overview

- **Task**: TASK-037 — Add comments domain and APIs
- **Status**: Completed & Verified
- **Scope**: `@supademo/domain`, `@supademo/database`, `@supademo/api`, `@supademo/web`

---

## Technical Changes & Architecture

### 1. Domain Layer (`packages/domain`)

- **Domain Model**: Created `Comment` type supporting `targetType` (`"demo"` | `"step"`), `targetId`, `threadId`, `parentId`, `authorUserId`, `content`, `mentions`, `reactions`, `isResolved`, `resolvedByUserId`, `resolvedAt`.
- **Validation & Input Parsers**:
  - `parseCreateCommentInput`: Validates target type, target ID, parent ID, max 2,000 char content, and bounded max 10 user mentions.
  - `parseUpdateCommentInput`: Validates content length and strips control characters.
  - `parseToggleResolveCommentInput`: Validates boolean resolution state.
  - `parseToggleCommentReactionInput`: Validates max 16 char emoji string.
- **Repository Interface**: Created `CommentRepository` interface.

### 2. Database Layer (`packages/database`)

- **Migration `2026071201100_comments.sql`**:
  - Created `demo_comments` table with foreign keys on `workspaces`, `users`, and self-referential `parent_id`.
  - Created partial indexes `demo_comments_workspace_target_idx` and `demo_comments_workspace_thread_idx`.
  - Updated `demo_audit_events` action check constraint for comment lifecycle events.
- **Repository Implementation (`DatabaseCommentRepository`)**:
  - `list`: Lists un-deleted comments for target in workspace.
  - `create`: Verifies `demo:read` capability and target existence, inherits parent thread ID or assigns new UUIDv7 thread ID, creates comment row, and logs `comment.created` audit event.
  - `update`: Enforces comment author ownership before mutating content and logs `comment.updated` audit event.
  - `delete`: Idempotently soft-deletes comment (allows author or workspace user with `demo:update` capability) and logs `comment.deleted` audit event.
  - `toggleResolve`: Updates `is_resolved`, `resolved_by_user_id`, `resolved_at` and logs `comment.resolved` / `comment.reopened`.
  - `toggleReaction`: Adds/removes user reaction on target emoji in JSONB payload and logs `comment.reaction_added` / `comment.reaction_removed`.

### 3. API & OpenAPI Contracts (`apps/api` & `@supademo/web`)

- **REST Endpoints**:
  - `GET /api/v1/workspaces/{workspaceId}/comments?targetType={type}&targetId={id}`
  - `POST /api/v1/workspaces/{workspaceId}/comments`
  - `PATCH /api/v1/workspaces/{workspaceId}/comments/{commentId}`
  - `DELETE /api/v1/workspaces/{workspaceId}/comments/{commentId}`
  - `POST /api/v1/workspaces/{workspaceId}/comments/{commentId}/resolve`
  - `POST /api/v1/workspaces/{workspaceId}/comments/{commentId}/reactions`
- **OpenAPI Specifications**: Registered schemas in `apps/api/src/openapi.ts`, regenerated `openapi.json` and client types `apps/web/src/generated/api.ts`.

---

## Security Analysis & Controls

1. **Authorization & Tenant Boundary Preservation**:
   - All operations require authenticated identity subject and workspace membership.
   - Target queries bind `workspace_id = $1` and `deleted_at IS NULL` on all SQL queries.

2. **Sanitization & Input Boundaries**:
   - Comment content is bounded (1-2000 chars) and control characters are stripped.
   - Mentions are capped at a maximum of 10 user IDs per comment.
   - Emoji reaction strings are bounded to max 16 characters.

3. **Replay & Idempotency**:
   - Comment creation accepts `Idempotency-Key` headers.
   - Comment deletion is idempotent.

---

## Verification Evidence

- `npm run format:check` -> Passed.
- `npm run lint` -> Passed (0 errors, 0 warnings).
- `npm run check:boundaries` -> Passed.
- `npm run typecheck` -> Passed.
- `npm run build` -> Next.js build succeeded.
- `npm test` -> 136 tests passed.
