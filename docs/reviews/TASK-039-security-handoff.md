# Security Review & Handoff — TASK-039: In-App Notifications

## Overview

- **Task**: TASK-039 — Add in-app notifications
- **Status**: Completed & Verified
- **Scope**: `@supademo/domain`, `@supademo/database`, `@supademo/api`, `@supademo/web`

---

## Technical Changes & Architecture

### 1. Domain Layer (`packages/domain`)

- **Domain Types (`NotificationType`, `Notification`)**: Supported notification types (`"comment_mention"`, `"comment_reply"`, `"workspace_invite"`, `"review_requested"`, `"review_approved"`, `"review_changes_requested"`).
- **Validation & Parsers**:
  - `parseCreateNotificationInput`: Validates recipient, notification type, title (1-200 chars), message (1-1000 chars), target type, and target ID.
  - `parseMarkNotificationReadInput`: Validates optional UUID notification ID or null (mark all read).
- **Repository Interface**: `NotificationRepository`.

### 2. Database Layer (`packages/database`)

- **Migration `2026071201200_notifications.sql`**:
  - Created `user_notifications` table with foreign keys on `workspaces` and `users`.
  - Created partial index `user_notifications_unread_idx` on `(workspace_id, recipient_user_id) WHERE is_read = false`.
- **Repository Implementation (`DatabaseNotificationRepository`)**:
  - `list`: Workspace-scoped query for recipient user notifications.
  - `unreadCount`: Efficient partial-index `COUNT(*)` query.
  - `create`: Inserts new UUIDv7 notification row for recipient.
  - `markRead`: Sets `is_read = true` and `read_at = now()` for specified ID or all unread notifications of recipient in workspace.

### 3. API & OpenAPI Contracts (`apps/api` & `@supademo/web`)

- **REST Endpoints**:
  - `GET /api/v1/workspaces/{workspaceId}/notifications`
  - `GET /api/v1/workspaces/{workspaceId}/notifications/unread-count`
  - `POST /api/v1/workspaces/{workspaceId}/notifications/mark-read`
- **OpenAPI & Web Client**: Registered OpenAPI specs and created `NotificationClient` / `NotificationCenter` component.

---

## Security Analysis & Controls

1. **Strict Recipient & Workspace Scoping**:
   - Notifications queries enforce `workspace_id = $1 AND recipient_user_id = $2` on all read and update statements. Users can never view or clear another user's notifications.

2. **Input Bounding & Validation**:
   - Title and message inputs are length-bounded and stripped.

---

## Verification Evidence

- `npm run format:check` -> Passed.
- `npm run lint` -> Passed (0 errors, 0 warnings).
- `npm run check:boundaries` -> Passed.
- `npm run typecheck` -> Passed.
- `npm run build` -> Next.js build succeeded.
- `npm test` -> 141 tests passed.
