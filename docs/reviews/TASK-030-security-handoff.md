# SECURITY REVIEW REQUEST — TASK-030

## Change summary

- Added workspace-scoped member listing, pending invitation listing, role changes, and recent membership audit-event APIs.
- Added an append-only `workspace_audit_events` migration for invitation, role-change, removal, and revocation events.
- Enforced member-role hierarchy: admins cannot grant the admin role, modify an admin/owner, or remove an admin/owner; no actor may change their own role; owner records cannot be role-changed.
- Added the Settings-only `/settings/members` experience with member listing, role management, invite form, pending invitation resend/revoke, and destructive-action confirmation.
- Connected the session CSRF token to profile, workspace, and member browser clients so cookie-authenticated UI mutations include `X-CSRF-Token`.

## Files changed

- `packages/domain/src/invitations.ts`, `packages/domain/src/index.ts`
- `packages/database/src/memberships.ts`
- `packages/database/migrations/2026071200500_member_administration.sql`
- `apps/api/src/app.ts`, `apps/api/src/openapi.ts`, `apps/api/openapi.json`
- `apps/web/src/lib/csrf.ts`, `apps/web/src/lib/auth-client.ts`, `apps/web/src/lib/profile-client.ts`, `apps/web/src/lib/workspace-client.ts`, `apps/web/src/lib/membership-client.ts`
- `apps/web/components/member-administration-screen.tsx`, `apps/web/components/app-shell.tsx`, `apps/web/app/settings/members/page.tsx`, `apps/web/app/globals.css`, `apps/web/src/generated/api.ts`
- `tests/api.test.mjs`, `tests/memberships.test.mjs`, `tests/member-administration-screen.test.mjs`, `tests/design-tokens.test.mjs`

## Trust boundaries and sensitive data affected

- Authenticated workspace-member identities, workspace membership roles, invitation recipient email addresses, opaque invitation identifiers, CSRF tokens, and audit records.
- Every repository lookup and mutation accepts the authenticated actor user ID plus workspace ID. Browser-provided IDs are URL-encoded client-side and validated/canonicalized server-side before SQL queries.

## Authorization model

- All member reads require the server-resolved `member:read` capability inside the requested workspace.
- Owner/admin may invite; owner/admin may update members subject to hierarchy. Admins cannot grant admin, edit admins/owners, or remove admins/owners. Owners cannot be role-changed, and self-role changes are denied.
- Member removal is separately capability-gated and prevents the final owner from being removed or leaving.
- Invitation revoke/resend remains server-authorized by workspace and actor capability.
- UI capability checks only hide/disable unavailable actions; the API/repository is authoritative.

## Threats considered

- Cross-workspace member/invitation/audit enumeration via substituted workspace IDs.
- Role escalation by changing a member to admin or mutating/removing owner/admin records.
- Ambient-cookie CSRF against invite, role update, removal, resend, and revoke operations.
- Leaking invitation tokens or excessive audit details to browser clients.
- UI optimistic updates that misrepresent a failed destructive mutation.
- SQL injection through member/workspace identifiers, role values, or invitation inputs.

## Security controls implemented

- Parameterized SQL with explicit `workspace_id` predicates and transaction-scoped membership checks.
- Strict role allowlist and role-hierarchy checks in the domain/repository boundary.
- Audit event types are an allowlisted database check constraint; events carry no invitation token or email payload.
- Existing API identity/session middleware, request-size limits, exact JSON field validation, CORS, and CSRF enforcement apply to every added route.
- Browser clients use `credentials: include`, `cache: no-store`, and the session-scoped CSRF token for unsafe requests.
- Destructive UI actions require a confirmation modal; local member/invitation state changes only after confirmed server success.

## Security tests added

- Cross-workspace member-list request receives a 403; malformed role input receives a 400.
- Repository role changes assert workspace-scoped update predicates and an audit-event append.
- Admin removal of an owner is denied; admin changes to privileged peers are denied.
- Migration/repository source tests verify tenant-scoped member/invitation/audit queries.
- UI tests cover permission-denied, loading, error, responsive table, confirmation, and client CSRF states.
- Existing invitation token hashing, final-owner, and authorization tests continue to pass.

## Checks run and results

```text
npm run verify
Result: passed (format, lint, boundaries, TypeScript, web type generation).

npm test
Result: passed: 99 tests passed, 1 integration test skipped because local DATABASE_URL/REDIS_URL are not configured.

npm run security:placeholders
Result: passed; deferred SAST, container, and IaC scanner placeholders remain documented.

Local browser visual inspection
Result: `/settings/members` rendered the responsive Settings shell and loading state at desktop width. A populated interaction requires an authenticated local API/session fixture; functional populated states are exercised by API/domain/UI tests.
```

## Checks not run

- Database integration tests: no local PostgreSQL/Redis stack or `.env` was configured; the repository’s integration test was skipped by design. Run `npm run stack:up && npm run db:migrate && npm run test:integration` with a valid local `.env`.
- Secret scanning, Semgrep/CodeQL, container scanning, IaC scanning, and dynamic staging testing: no configured repository command/tool is available. Risk is that supply-chain/configuration findings may remain undetected outside the checked code paths.
- `npm audit --audit-level=high` remains a release blocker from TASK-029: seven high upstream findings in the pinned Next.js/OpenAPI toolchain are documented in `TASK-029-security-handoff.md`.

## Dependencies or infrastructure permissions added

- No package, runtime service, cloud permission, secret, IAM action, or external data transfer was added.

## Known limitations and residual risks

- The audit-event table currently covers membership administration only; full product audit coverage is planned for TASK-128.
- The current local UI cannot run populated end-to-end flows without configured local identity, database, and invitation-delivery adapters. It fails closed/uses the appropriate error state instead.
- Production session-store and Cognito workflow wiring remain required before production login can issue browser sessions, as documented in TASK-029.
- The documented upstream high-severity dependency findings are unresolved and must be remediated or explicitly accepted by an authorized human before release.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Status

Pending independent Claude review. Do not mark TASK-030 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
