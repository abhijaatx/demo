# SECURITY REVIEW REQUEST

## Change summary

- Added workspace-scoped folders and subfolders, including hierarchy-safe creation, rename, move, and content-preserving deletion.
- Added assignment of an active demo to a folder or Unfiled.
- Added authenticated folder APIs, OpenAPI documentation, a dashboard folder rail, breadcrumbs, URL-backed folder selection, drag-to-move interactions, and explicit rename/delete controls.

## Files changed

- `packages/domain/src/folder.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/demo.ts`
- `packages/database/migrations/2026071200700_folders.sql`
- `packages/database/src/folders.ts`
- `packages/database/src/demos.ts`
- `packages/database/src/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/index.ts`
- `apps/api/src/openapi.ts`
- `apps/api/openapi.json`
- `apps/web/src/generated/api.ts`
- `apps/web/src/lib/folder-client.ts`
- `apps/web/src/lib/demo-client.ts`
- `apps/web/components/demo-dashboard-screen.tsx`
- `apps/web/app/globals.css`
- `tests/api.test.mjs`
- `tests/demos.test.mjs`
- `tests/folders.test.mjs`
- `tests/folder-dashboard-screen.test.mjs`
- `docs/folder-lifecycle.md`

## Trust boundaries and sensitive data affected

- Browser-originated folder names, IDs, parent IDs, expected versions, idempotency keys, drag/drop intent, and workspace route IDs.
- Authenticated, multi-tenant API operations over folder metadata and demo organization.
- Folder-to-demo and parent-child foreign-key relations in PostgreSQL.
- The dashboard only receives workspace-scoped API responses; it has no direct database access.

## Authorization model

- Folder listing requires server-verified `demo:read` membership in the route workspace.
- Folder create, rename, move, and delete require server-verified `demo:update` membership in the route workspace.
- Assigning a demo to a folder requires server-verified `demo:update`; both demo and target folder lookups include `workspace_id`.
- Client capability checks only disable unavailable controls. They are not authorization controls.

## Threats considered

- Cross-workspace folder, parent, or demo ID substitution.
- Cycles from moving a folder into itself or a descendant.
- Concurrent structural changes creating a cycle or overwriting a newer version.
- Excessive nesting and recursive traversal abuse.
- Duplicate create retries.
- Cookie-authenticated cross-site mutations.
- Malformed and oversized folder payloads, untrusted drag events, XSS through folder names, and sensitive error leakage.

## Security controls implemented

- Strict allowlisted parsers reject unknown fields, malformed UUIDv7 IDs, invalid versions, control characters, empty names, and names over 120 characters.
- Database queries are parameterized, every record lookup/mutation binds `workspace_id`, and composite foreign keys prevent cross-workspace parent/demo associations.
- Folder mutations obtain a transaction-scoped workspace advisory lock, row locks, and compare `expectedVersion`; stale writes return a conflict.
- Recursive checks reject self/descendant moves and nesting beyond ten levels before mutation.
- Folder creation is idempotent per workspace, actor, and key; folders are audit logged.
- Folder deletion is transactional: direct demos and children move to the former parent before deletion. The rule is documented in `docs/folder-lifecycle.md`.
- Browser clients encode identifiers, use `credentials: include`, `cache: no-store`, and add the established CSRF header to mutations. Folder creation has an idempotency key.
- React renders folder names as text; the changed code uses no unsafe HTML or dynamic execution APIs.

## Security tests added

- Strict folder-input validation and malformed hierarchy payload rejection.
- API tests for authentication, missing idempotency keys, malformed move input, and cross-workspace denial.
- Repository tests for workspace-bound creation, hierarchy lock use, cycle rejection before update, optimistic versions, and transactional deletion preservation.
- Migration checks for workspace-bound composite keys and idempotency persistence.
- Dashboard/client tests for URL-backed scope, CSRF, credential inclusion, no-store requests, encoded IDs, no unsafe rendering APIs, responsive focus styling, and delete disclosure.

## Checks run and results

- `npm run verify` — passed (formatting, ESLint, workspace-boundary checks, and type checks).
- `npm run security:placeholders` — passed; it records absent SAST, container, and IaC scanners.
- `npm test` — passed: 115 passed, 1 skipped. The skipped test needs local `DATABASE_URL` and `REDIS_URL`.
- `npm audit --audit-level=high` — failed with 7 existing high-severity dependency findings: transitive `brace-expansion`/`js-yaml` under `openapi-typescript`, plus Next.js transitive PostCSS and Sharp findings. No dependency was added for TASK-033.

## Checks not run

- Database/Redis integration test: local `DATABASE_URL` and `REDIS_URL` are not configured. Remaining risk: migration and real PostgreSQL advisory-lock behavior were tested with repository mocks, not a running database. Run `npm test` after supplying the local services.
- Semgrep/CodeQL, Gitleaks, Trivy/container scanning, and Checkov/IaC scanning: the repository has no configured executables; the placeholder command documents this gap. Remaining risk: scanner coverage is absent.
- Browser interaction test: no authenticated, database-backed local fixture is configured. Remaining risk: native drag/drop was source- and build-tested but not exercised in a browser against a live API.

## Dependencies or infrastructure permissions added

- None.

## Known limitations and residual risks

- The existing seven high-severity audit findings remain a release blocker until remediated or formally accepted by an authorized human with an expiry.
- Folder deletion is immediate but preserves only organization; it does not create a folder-trash record. Demo deletion and retention remain governed by the separate demo lifecycle.
- Native drag/drop is an enhancement; folder create, rename, and confirmed deletion are keyboard-accessible, but a fully keyboard-operated demo-to-folder move picker is not yet implemented.
- No independent Claude security review has yet been performed.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
