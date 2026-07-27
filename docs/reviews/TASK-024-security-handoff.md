# TASK-024 security handoff

Status: pending independent Claude review.

## Scope reviewed

TASK-024 adds organization ownership, workspace creation/listing, role storage, transactional creator membership, and durable idempotency handling.

Primary files:

- `packages/database/migrations/2026071200300_workspace_ownership.sql` — organization owner context and idempotency persistence.
- `packages/domain/src/workspace.ts` — role, input, slug, idempotency-key, and conflict validation.
- `packages/database/src/workspaces.ts` — transactional creation, owner membership, replay handling, and user-scoped listing.
- `apps/api/src/app.ts` and `apps/api/src/openapi.ts` — authenticated workspace API routes and contract.
- `apps/api/src/index.ts` — production composition of the database workspace repository.
- `tests/workspace.test.mjs` and `tests/api.test.mjs` — validation, authorization, rollback, idempotency, and HTTP coverage.

## Security properties

- Workspace operations require the established authentication middleware.
- The local user is resolved by authenticated identity synchronization; request bodies cannot choose an owner or membership role.
- Listing is scoped by the authenticated local `user_id` and joins through memberships, preventing user-IDOR expansion.
- Organization ownership is persisted in the database and the creator membership is inserted in the same transaction as the organization/workspace.
- Creation requires a bounded idempotency key. Same-key same-payload replay returns the original workspace; same-key different-payload replay conflicts without creating a second workspace.
- Partial failures roll back organization, workspace, membership, and idempotency reservation together.
- Names, slugs, and idempotency keys are bounded, control-character checked, and unknown create fields are rejected.
- Slugs are normalized and validated before parameterized SQL. User input is never interpolated into SQL text.
- Role values are database-constrained and the create path always writes `owner` explicitly.
- Public errors do not expose database/provider details, request fingerprints, or identifiers from conflicting requests.

## Verification performed

Focused command:

```text
node --test tests/workspace.test.mjs tests/api.test.mjs
```

Final repository results:

- `npm test`: 84 total, 83 passed, 1 expected integration test skipped because `DATABASE_URL`/`REDIS_URL` were not configured.
- `npm run verify`: passed formatting, lint, workspace boundaries, and type checks.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- Production build passed and the generated OpenAPI contract includes `/api/v1/workspaces`.

The focused tests cover malformed names/slugs, unknown fields, transactional owner membership, rollback, idempotency replay/conflict, user-scoped listing, unauthenticated access, required idempotency headers, and normalized API input.

## Boundaries requiring follow-up

- Live PostgreSQL migration execution and concurrent transaction testing were not run because `.env`/database credentials are unavailable in this workspace.
- Role authorization for admin/editor/viewer operations is intentionally deferred to TASK-027; this task only stores the role and grants owner to the creator.
- Workspace switching, onboarding, current-workspace persistence, and stale-selection recovery are TASK-025 work.
- Idempotency-key retention/cleanup needs an operational policy before long-lived production use.
- The organization ownership migration assumes no pre-existing organizations without owners; production rollout must include a reviewed backfill plan if that assumption changes.
- This handoff is not a claim that the implementation is vulnerability-free. Independent Claude review must inspect the final diff and verification output before TASK-024 is marked complete.

## Claude review checklist

- [ ] Confirm every workspace list/create path derives ownership from authenticated identity and does not trust client IDs or roles.
- [ ] Confirm transaction rollback covers all organization, workspace, membership, and idempotency writes.
- [ ] Confirm concurrent same-key requests cannot create duplicate organizations/workspaces.
- [ ] Confirm same-key different-payload conflicts do not disclose the original request.
- [ ] Confirm migration/backfill and idempotency retention plans are approved for production.
- [ ] Confirm final build, tests, verification, migration checks, and dependency audit results are attached.
