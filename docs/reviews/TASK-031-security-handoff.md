# SECURITY REVIEW REQUEST — TASK-031

## Change summary

- Added the workspace-owned demo metadata model with title, description, type, lifecycle status, timestamps, owner, and recoverable soft-delete state.
- Added transaction-scoped, tenant-safe demo CRUD and lifecycle APIs, including explicit state-transition validation, server-side publish permission checks, and restore.
- Added create-request idempotency records so retried draft creation does not create duplicate demos.
- Added append-only demo audit events for creation, metadata updates, status changes, deletion, and restoration.

## Files changed

- `packages/domain/src/demo.ts`, `packages/domain/src/index.ts`
- `packages/database/src/demos.ts`, `packages/database/src/index.ts`
- `packages/database/migrations/2026071200600_demo_lifecycle.sql`
- `apps/api/src/app.ts`, `apps/api/src/index.ts`, `apps/api/src/openapi.ts`, `apps/api/openapi.json`
- `apps/web/src/generated/api.ts`
- `tests/demos.test.mjs`, `tests/api.test.mjs`

## Trust boundaries and sensitive data affected

- Authenticated actor identity, workspace membership role, workspace and demo identifiers supplied in URLs, mutable demo metadata, lifecycle state, deletion state, and audit records.
- Demo titles and descriptions are untrusted user input. They are validated and stored as text only; this task does not render them as HTML or fetch external URLs.

## Authorization model

- Every database operation receives actor user ID and workspace ID, verifies a current membership role inside the same transaction, and maps that role to a required capability.
- `demo:read` gates list/get; `demo:create` gates creation; `demo:update` gates metadata and non-publish lifecycle transitions; `demo:publish` gates transitions to `published`; `demo:delete` gates soft delete and restore.
- Demo lookups and mutations bind both `id` and `workspace_id`; soft-deleted records are excluded from normal reads and mutations. UI visibility is not used for authorization.

## Threats considered

- Cross-workspace demo enumeration or mutation via substituted workspace/demo IDs.
- Publishing or deleting a demo with only viewer/editor permissions.
- Mass assignment of status, owner, workspace, timestamps, or undeclared fields.
- Replay of create requests creating duplicate demo records.
- Invalid lifecycle jumps, deleted-content exposure, and audit-log inconsistencies.
- SQL injection through metadata or identifiers; reflected/stored XSS in later UI rendering.

## Security controls implemented

- Strict allowlisted JSON shapes and bounded title/description/type/status validation at the API/domain boundary.
- Parameterized SQL, UUIDv7 identifier validation, workspace predicates on every demo query, and transactions around authorization, mutation, idempotency, and audit append.
- Explicit finite state machine; invalid transitions return a conflict without updating the demo.
- Publicly visible lifecycle data excludes soft-deleted records. Restore is authorized separately and retains immutable workspace/owner ownership.
- Create requests require a bounded idempotency key and persist a request fingerprint scoped to workspace and actor.
- Audit rows use constrained action/status combinations to prevent malformed delete, restore, and status-change records.
- Existing API authentication, request-size limits, strict CORS, and CSRF enforcement cover the new routes.

## Security tests added

- Domain tests reject unknown fields, controls in text, invalid types, and forbidden status transitions.
- Repository tests verify workspace-bound SQL predicates, role-based publish denial, no update after invalid transition, soft delete/restore behavior, idempotency persistence, and audit append operations.
- API tests cover unauthenticated access, missing idempotency key, strict status body validation, and cross-workspace authorization denial.
- Migration test checks tenant ownership, soft-delete indexes, audit table/action constraints, and composite idempotency scope.

## Checks run and results

```text
npm run build
Result: passed; API contract and typed web client regenerated, and the production web build completed.

npm run verify
Result: passed (format, lint, workspace boundaries, TypeScript, and web type generation).

npm test
Result: passed: 105 tests passed; 1 integration test skipped because local DATABASE_URL/REDIS_URL are not configured.

npm run security:placeholders
Result: passed; deferred SAST, container, and IaC scanner placeholders remain documented.

npm audit --audit-level=high
Result: failed with 7 high-severity upstream dependency findings in the pinned Next.js/OpenAPI toolchain; this remains a release blocker.

Manual source review
Result: reviewed the domain state machine, API route dispatch, database query predicates, audit constraint, and generated contract. No unsafe DOM execution, dynamic code execution, or unparameterized SQL was found in this task's implementation.
```

## Checks not run

- Database integration tests require a configured local PostgreSQL/Redis stack and `.env`. Run `npm run stack:up && npm run db:migrate && npm run test:integration`.
- Secret scanning, Semgrep/CodeQL, container scanning, IaC scanning, and dynamic staging testing do not have configured repository commands. Risk: findings outside these unit/API paths may remain undetected.

## Dependencies or infrastructure permissions added

- No package, runtime service, cloud permission, secret, IAM action, or external data transfer was added.

## Known limitations and residual risks

- The task establishes API/domain lifecycle metadata only; future editor, viewer, embedding, upload, and public-link work must continue to treat demo content as untrusted and use the planned isolated rendering architecture.
- Database integration coverage is not yet run locally because no database stack is configured.
- The documented upstream high-severity dependency findings from TASK-029 remain unresolved and block release unless remediated or explicitly accepted by an authorized human.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Status

Pending independent Claude review. Do not mark TASK-031 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
