# Organizations and workspaces

TASK-024 builds the organization/workspace boundary on the existing foundation tables.

## Ownership and roles

- Every organization has an `owner_user_id` referencing the local `users` record.
- Every workspace belongs to exactly one organization.
- The creator receives one transactional `owner` membership for the new workspace.
- Membership roles are constrained to `owner`, `admin`, `editor`, and `viewer`. Role authorization beyond creator ownership is deferred to TASK-027, but the role is never accepted from the create request.

## Creation

`POST /api/v1/workspaces` requires an authenticated identity, a validated `Idempotency-Key` header, and an exact body containing `organizationName`, `workspaceName`, and `slug`. Names are trimmed and bounded to 200 characters. Slugs are normalized to lowercase and must match the bounded URL-safe pattern.

Creation runs in one database transaction: it locks/verifies the local user, reserves the idempotency key, creates the organization with an owner, creates the workspace, creates the owner membership, stores the resulting IDs, and returns the joined workspace summary. Any failure rolls back all records. Replaying the same key and payload returns the original workspace; replaying the key with different values returns a generic conflict.

## Listing

`GET /api/v1/workspaces` joins memberships to workspaces and organizations using the authenticated local user ID. It never accepts a user ID or workspace ID from the browser for listing, so the query cannot be widened to another user’s memberships by changing request parameters.

The API routes are authenticated through the TASK-021 middleware and use the TASK-023 identity synchronization boundary to resolve the local user. Workspace creation/listing is intentionally API-first; onboarding and workspace switching UI are TASK-025 work.

## Idempotency retention

`workspace_creation_requests` stores the owner, bounded idempotency key, normalized request fingerprint, and created organization/workspace IDs. It is deleted with the owner user. A future retention policy may prune old keys only after preserving replay behavior for the supported retry window.
