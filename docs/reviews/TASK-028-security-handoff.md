# TASK-028 security handoff

Status: pending independent Claude review.

## Scope

Tenant-scoped repository interfaces, in-memory reference implementation, workspace predicates, mutation ownership checks, and cross-workspace negative fixtures.

Primary files:

- `packages/domain/src/tenant.ts`
- `packages/domain/src/index.ts`
- `tests/authorization.test.mjs`
- `docs/tenant-safety.md`

## Security properties

- Every repository operation requires a tenant scope containing authenticated user, workspace, and role.
- Reads return only records whose workspace matches the scope.
- Creates reject mismatched workspace ownership and duplicate IDs.
- Updates reject ID or workspace changes and cannot update records from another workspace.
- Deletes cannot remove records from another workspace.
- Each operation requires the centralized capability for that operation.
- Source-contract tests reject unscoped lookup helper patterns.

## Verification

- `npm test`: 93 tests, 92 passed, 1 expected integration test skipped because local database/Redis variables are unavailable.
- `npm run verify`: passed.
- `npm audit --audit-level=high`: 0 vulnerabilities.
- No live integration fixture ran because database/Redis credentials are not configured locally.

## Follow-up

The in-memory implementation is the reference contract; future PostgreSQL repositories must put workspace predicates in parameterized SQL and use authenticated membership-derived scope. Claude should inspect every new resource repository for accidental `getById`/ID-only paths and confirm cross-workspace not-found behavior. This handoff is not a claim that the implementation is vulnerability-free.
