# SECURITY REVIEW REQUEST — TASK-005

## Change summary

- Added `pg@8.22.0` runtime access and `node-pg-migrate@8.0.4` migration tooling to `@supademo/database`.
- Added a bounded PostgreSQL pool factory with explicit idle-client error handling and close support.
- Added parameterized query and transaction helpers with guaranteed client release and rollback handling.
- Added a stable `SELECT 1 AS health_check` database health query.
- Added application-generated UUIDv7 identifiers and canonical validation.
- Added the first timestamped foundation migration for organizations, users, workspaces, and memberships with tenant-oriented foreign keys, role checks, unique constraints, and timestamps.
- Added migration, rollback, dry-run, and health commands plus database operating documentation.
- Added unit and local PostgreSQL integration validation for migrations, constraints, rollback, health, UUIDv7, and transaction failure paths.

## Files changed

- `packages/database/package.json`
- `packages/database/src/index.ts`
- `packages/database/src/pool.ts`
- `packages/database/src/transaction.ts`
- `packages/database/src/health.ts`
- `packages/database/src/ids.ts`
- `packages/database/migrations/2026071200000_foundation.sql`
- `package.json`, `package-lock.json`
- `scripts/check-database.mjs`
- `tests/database.test.mjs`
- `README.md`, `docs/database.md`

## Trust boundaries and sensitive data affected

- Database connection strings are accepted only through the typed configuration boundary introduced in TASK-004 and are passed to `pg` without being logged by this package.
- SQL text and parameter arrays cross the application-to-PostgreSQL boundary. The query helper accepts values separately so repositories can use PostgreSQL placeholders instead of string concatenation.
- Transaction callbacks execute with a leased `PoolClient`; the helper controls `BEGIN`, `COMMIT`, `ROLLBACK`, and release.
- Migration commands can change schema and must run with a migration-capable role. Application runtime roles must be separate and schema-read/write permissions must be restricted in production.
- The migration creates tenant roots and memberships. Future tenant-owned tables must include `workspace_id` and repository-level authorization checks.

## Authorization model

- No API authorization or user-facing resource lookup was added.
- The schema establishes organization/workspace ownership and workspace-scoped memberships, but database foreign keys are not an authorization system.
- `memberships` is keyed by `(workspace_id, user_id)` and has an allowlisted role check; application repositories still must enforce identity, workspace scope, and action-specific permissions.
- Destructive foreign-key behavior is conservative: organization and user deletion is restricted; membership deletion follows workspace deletion.

## Threats considered

- SQL injection through dynamic query values.
- Connection pool exhaustion or leaked clients during transaction failures.
- Partial migrations or schema drift during deployment.
- Accidental destructive rollback or cascading data loss.
- Sequential or guessable identifiers exposing record ordering.
- Invalid UUID values and non-canonical identifier formats.
- Invalid tenant membership roles and duplicate user/workspace relationships.
- Health endpoints leaking database driver errors or connection details.
- Database driver idle-client errors crashing the process or being silently discarded.
- Production application roles being used to run migrations.

## Security controls implemented

- Query helper separates SQL text and parameter values; documentation requires `$1`-style parameterization.
- Transaction helper always releases the client and attempts rollback on callback failure.
- Rollback failure produces a generic error without returning driver details or connection credentials.
- Pool options bound maximum connections, idle timeout, and connection timeout; idle-client errors require an explicit caller callback.
- Health checks return only boolean health and latency, not raw database errors.
- UUIDv7 generation uses cryptographically random bytes for the random portions and validates version/variant bits.
- Primary keys are application-generated UUID values with no sequential database defaults.
- Foundation tables include bounded text checks, normalized-email uniqueness, slug validation, role allowlisting, foreign keys, and timestamps.
- Migrations use timestamp ordering, order checks, and a single transaction; the down migration is explicit and reviewable.
- Migration scripts are separate from runtime package code and documented for distinct migration/runtime roles.
- No browser-facing package imports the database package.

## Security tests/checks added or run

- UUIDv7 canonical format, version/variant, sort order, and invalid timestamp tests.
- Health query success/failure tests with no error disclosure.
- Transaction commit, rollback, release, and rollback-failure tests.
- Local migration applied successfully against PostgreSQL.
- Schema constraints rejected case-insensitive duplicate email and invalid membership roles.
- Migration rollback and re-apply succeeded against the local database.
- `npm run db:health` passed.
- `npm run db:dry-run` reported no pending migrations.
- `npm run verify` passed: formatting, ESLint, workspace boundaries, and TypeScript checks.
- `npm test` passed with 15/15 tests.
- `npm audit --omit=dev` and `npm audit --audit-level=high` reported 0 vulnerabilities.

## Checks not run

- Secret scanning, SAST beyond ESLint, container scanning, SBOM generation, and IaC scanning remain deferred to TASK-010.
- No production AWS RDS migration, role, backup, restore, lock-contention, or rolling-deployment drill was run.
- No high-concurrency pool load test was run; pool defaults are bounded but require performance validation as repositories are added.
- Migration rollback was validated locally only; production destructive rollback requires an approved recovery plan and backup verification.

## Dependencies or infrastructure permissions added

- Runtime dependency: `pg@8.22.0`.
- Development dependency: `node-pg-migrate@8.0.4` and `@types/pg@8.20.0`.
- No AWS resources, IAM actions, production database roles, or cloud credentials were added.

## Known limitations and residual risks

- `pg` does not provide higher-level transaction semantics; callers must use `withTransaction` for multi-step atomic work and must not issue transaction statements through unrelated pool queries.
- The initial schema is foundational, not a complete product schema. It does not yet add Row-Level Security, audit logs, soft deletion, or repository authorization.
- `updated_at` is not automatically maintained by a trigger; repositories must update it consistently until a later reviewed policy is introduced.
- UUIDv7 generation is application-side; all services that create IDs must use the shared helper rather than ad hoc UUID generation.
- `node-pg-migrate` logs migration SQL by default. Migration SQL must never contain secrets or personal data literals.
- Production migration/runtime role separation, RDS encryption, backups, PITR, and connection proxy configuration remain infrastructure work.

## Requested Claude review

Review the full diff and surrounding configuration for SQL injection paths, missing tenant scopes, unsafe foreign-key deletion, migration ordering/rollback hazards, role/permission confusion, pool leaks, transaction misuse, identifier implementation errors, dependency risk, migration SQL logging, connection-secret exposure, and missing production recovery controls. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-005 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
