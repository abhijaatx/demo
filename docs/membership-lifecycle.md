# Invitations and membership lifecycle

TASK-026 adds workspace invitations and member lifecycle operations behind an injectable repository and delivery boundary.

## API surface

- `POST /api/v1/workspaces/:workspaceId/invitations` creates an invitation for `admin`, `editor`, or `viewer` and queues delivery through `InvitationDelivery`.
- `POST /api/v1/invitations/accept` accepts an invitation using `{ "token": "..." }`.
- `POST /api/v1/workspaces/:workspaceId/invitations/:invitationId/resend` rotates the token and sends a fresh message.
- `POST /api/v1/workspaces/:workspaceId/invitations/:invitationId/revoke` revokes an unused invitation.
- `DELETE /api/v1/workspaces/:workspaceId/members/:memberId` removes a member when policy permits.
- `POST /api/v1/workspaces/:workspaceId/leave` removes the authenticated member from the workspace.

Invitation creation and resend return `202` with a generic message. Raw tokens are passed only to the delivery adapter and are never returned in an API response or stored in the database.

## Token and lifecycle rules

- Tokens are generated with Node’s cryptographically secure random bytes and stored as SHA-256 hashes.
- Acceptance looks up only an unaccepted, unrevoked, unexpired hash, locks the invitation row, creates or updates membership, and marks the invitation accepted in one transaction.
- Acceptance checks the normalized target email and returns the same generic invalid/expired result for absent, expired, revoked, replayed, and mismatched invitations.
- Expiry must be in the future and no more than 30 days away; the API default is seven days.
- Resend rotates the hash and expiry. Revoke prevents acceptance. Invitation and membership queries are scoped by workspace ID.
- The final owner cannot leave and cannot be removed. A member cannot remove themselves through the removal endpoint; they must use leave.

## Production boundary

The repository is composed in the API process, but the production composition does not yet provide an SES/email delivery adapter. Invitation routes fail closed with a generic 503 until a reviewed delivery implementation is injected. The migration has not been applied to a live database in this local-only environment.
