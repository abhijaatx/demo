# SECURITY REVIEW REQUEST — TASK-034

## Change summary

- Added workspace-owned tags, idempotent tag creation, demo-tag assignment/removal, and immutable audit events for tag changes.
- Added authenticated, workspace-scoped tag API routes and OpenAPI contract coverage.
- Added allowlisted server-side demo search and filters for title/description, owner, type, status, tag, and update date range.
- Added a simple, accessible dashboard filter modal, debounced search, shareable filter URLs, tag creation, and demo tagging controls.

## Files changed

- `apps/api/src/app.ts`
- `apps/api/src/index.ts`
- `apps/api/src/openapi.ts`
- `apps/api/openapi.json`
- `apps/web/app/globals.css`
- `apps/web/components/demo-dashboard-screen.tsx`
- `apps/web/src/generated/api.ts`
- `apps/web/src/lib/demo-client.ts`
- `apps/web/src/lib/tag-client.ts`
- `packages/database/migrations/2026071200800_tags_and_demo_search.sql`
- `packages/database/src/demos.ts`
- `packages/database/src/index.ts`
- `packages/database/src/tags.ts`
- `packages/domain/src/demo.ts`
- `packages/domain/src/index.ts`
- `packages/domain/src/tag.ts`
- `tests/api.test.mjs`
- `tests/demos.test.mjs`
- `tests/tags.test.mjs`
- `tests/tag-dashboard-screen.test.mjs`

## Trust boundaries and sensitive data affected

- Authenticated browser query parameters now control demo search predicates.
- Workspace members can create tags and associate them with demos.
- Workspace IDs, demo IDs, tag IDs, owner IDs, titles, descriptions, and update dates cross the API/database boundary.
- No new credentials, tokens, personal data types, third parties, or external fetches were added.

## Authorization model

- Listing demos and tags requires `demo:read` after identity authentication and workspace membership lookup.
- Creating tags and assigning/removing tags requires `demo:update` after identity authentication and workspace membership lookup.
- Every demo/tag relation lookup includes the caller’s `workspace_id`; assignment validates that both the active demo and the tag belong to that workspace before insertion.
- Search predicates always include `workspace_id = $1` and exclude soft-deleted demos.

## Threats considered

- Cross-workspace demo, tag, and tag-assignment access.
- SQL injection and expensive search input through URL parameters.
- Duplicate query parameters and unknown parameter smuggling.
- Malformed UUIDs, invalid enum values, invalid/overflowing dates, duplicate tag IDs, oversized search values, and duplicate tag names.
- Replay of tag creation and duplicate tag assignment audit noise.
- Client-side manipulation of visibility or permissions.

## Security controls implemented

- Strict allowlists, maximum lengths, enum checks, canonical UUIDv7 validation, date round-trip validation, and a maximum of ten tag filters.
- Duplicate and unsupported demo-search query parameters are rejected before route handling.
- Parameterized SQL only; full-text search uses `websearch_to_tsquery` with bound values.
- Composite foreign keys bind demo-tag rows and tag audit records to one workspace.
- Idempotency keys bind tag creation replays to actor, workspace, and request fingerprint.
- Unique name violations map to a stable conflict response.
- Tag assignment writes an audit record only when a relation is newly created; removals audit only actual removals.
- Browser client uses credentials, CSRF headers for mutations, encoded path segments, typed response checks, and no unsafe HTML APIs.

## Security tests added

- Domain tests for strict tag/search input validation, invalid dates, duplicate tags, and unknown query keys.
- Repository tests for role denial, cross-workspace assignment rejection, no write after failed relation lookup, duplicate-name conflict mapping, parameterized search, and retained workspace predicate.
- API tests for unauthenticated tags, required idempotency, tag assignment, forbidden workspace access, parsed search filters, and duplicate query rejection.
- Dashboard/client source tests for debounced URL state, encoded requests, CSRF, credential use, and absence of unsafe HTML execution APIs.

## Checks run and results

- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm test` — passed: 122 tests passed, 1 integration test skipped because `DATABASE_URL` and `REDIS_URL` are not configured.
- `npm run verify` — passed (format, lint, workspace boundary check, type check).
- `npm run security:placeholders` — passed; documents unavailable SAST, container, and IaC scanners.
- `npm audit --audit-level=high` — failed with 7 high-severity dependency findings, described below.

## Checks not run

- `npm run test:integration` — local PostgreSQL and Redis were not configured; run after `cp .env.example .env` and starting the local stack. Risk: migrations and cross-tenant behavior were not exercised against a live database in this review.
- `npm run db:dry-run` — attempted but `DATABASE_URL` is not configured. Risk: the migration was reviewed statically and is covered by migration-contract tests, but was not parsed or applied by PostgreSQL locally.
- SAST, container-image, and IaC scans — tools are not configured in this repository. Risk: these classes of findings rely on manual review and existing tests.
- Visual-regression screenshot — no authenticated local fixture is configured. Risk: keyboard and responsive behavior is source-tested but was not manually exercised in a browser for this handoff.

## Dependencies or infrastructure permissions added

- None.

## Known limitations and residual risks

- `npm audit --audit-level=high` reports seven high findings in existing Next.js/PostCSS/sharp and `openapi-typescript` transitive dependencies. No risk acceptance was requested; this blocks a production release until remediated or explicitly accepted by an authorized human.
- Tag removal is available via the API but the dashboard currently provides only an “Add tag” workflow; a tag can be re-applied harmlessly. A richer tag-management surface is follow-up product work.
- The owner filter currently accepts an owner ID rather than a member-name picker; member-directory UX is planned separately.
- Independent Claude security review is still required before TASK-034 can be marked complete.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
