# TASK-026 security handoff

Status: pending independent Claude review.

## Scope

Invitation creation/delivery, secure acceptance, expiry, revocation, resend, member removal, leave-workspace, and membership migration.

Primary files:

- `packages/domain/src/invitations.ts`
- `packages/database/src/memberships.ts`
- `packages/database/migrations/2026071200400_membership_lifecycle.sql`
- `apps/api/src/app.ts` and `apps/api/src/openapi.ts`
- `tests/memberships.test.mjs` and `tests/api.test.mjs`

## Security properties

- Raw invitation tokens are generated with secure randomness, hashed at rest, scoped by workspace, and never returned by HTTP.
- Acceptance is single-use and transactional, with email matching and expiry/revocation checks.
- Expiry is future-dated and bounded to 30 days; API invitations default to seven days.
- Resend rotates the token hash; revoke, replay, expired, mismatched-email, and cross-workspace cases fail closed.
- Final-owner removal/leave is rejected; self-removal uses the explicit leave path.
- Delivery is an injected boundary. Without a configured adapter, invitation creation fails closed rather than pretending delivery succeeded.

## Verification

- `npm test`: 93 tests, 92 passed, 1 expected integration test skipped because local database/Redis variables are unavailable.
- `npm run verify`: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- Live PostgreSQL migration/concurrency tests were not run because `.env` credentials are absent.

## Follow-up

Before production, provide a reviewed SES/email adapter, rate-limit invitation creation and acceptance, define invite retention/cleanup, and run migration/backfill/concurrency tests against an isolated database. Claude should inspect token lifecycle, transaction locking, error equivalence, and delivery failure semantics. This handoff is not a claim that the implementation is vulnerability-free.
