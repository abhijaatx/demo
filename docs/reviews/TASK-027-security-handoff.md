# TASK-027 security handoff

Status: pending independent Claude review.

## Scope

Central capability matrix, workspace-aware authorization context, role-derived UI capability hints, and server-side policy tests.

Primary files:

- `packages/domain/src/authorization.ts`
- `packages/domain/src/tenant.ts`
- `packages/database/src/memberships.ts`
- `packages/database/src/workspaces.ts`
- `apps/api/src/app.ts`
- `tests/authorization.test.mjs` and `tests/memberships.test.mjs`

## Security properties

- Owner/admin/editor/viewer/guest capabilities are centrally defined.
- Workspace ID equality is checked before role capability evaluation.
- Default behavior is deny; policy failures map to generic 403 responses.
- API and repository code enforce policy; UI capability arrays only control affordances and cannot authorize requests.
- Capability arrays returned in workspace summaries are immutable copies.

## Verification

- `npm test`: 93 tests, 92 passed, 1 expected integration test skipped because local database/Redis variables are unavailable.
- `npm run verify`: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.

## Follow-up

Future resource APIs must call these policies for every read and mutation. Claude should review the role matrix against product requirements, check for route-local authorization bypasses, and verify guest behavior across share/player endpoints. Resource-specific policy composition remains part of later demo features. This handoff is not a claim that the implementation is vulnerability-free.
