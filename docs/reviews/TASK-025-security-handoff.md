# TASK-025 security handoff

Status: pending independent Claude review.

## Scope

Workspace onboarding, current-workspace persistence, switcher behavior, stale-selection recovery, empty states, and fixed internal navigation.

Primary files:

- `apps/web/components/app-shell.tsx`
- `apps/web/components/workspace-onboarding-screen.tsx`
- `apps/web/src/lib/workspace-client.ts`
- `apps/api/src/app.ts`
- `packages/database/src/workspaces.ts`
- `packages/database/migrations/2026071200400_membership_lifecycle.sql`
- `tests/workspace-screen.test.mjs` and `tests/api.test.mjs`

## Security properties

- Current workspace is persisted only through a membership-scoped repository update.
- Stale/deleted selections fall back to the first authenticated membership or a generic no-workspace state.
- Browser reads use `no-store`, and switching refreshes route data to reduce cross-tenant stale-data exposure.
- Onboarding uses a fixed internal redirect; no user-controlled redirect URL is accepted.
- Workspace creation/listing remains authenticated and user-scoped from TASK-024.

## Verification

- `npm test`: 93 tests, 92 passed, 1 expected integration test skipped because local database/Redis variables are unavailable.
- `npm run verify`: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- Browser automation was not run; no browser runner is configured.

## Follow-up

Claude should inspect route refresh/cache behavior, stale-selection recovery under concurrent deletion, and whether each future tenant data loader derives scope from authenticated membership rather than the UI selection. This handoff is not a claim that the implementation is vulnerability-free.
