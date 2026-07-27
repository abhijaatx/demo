# SECURITY REVIEW REQUEST — TASK-008

## Change summary

- Added a typed queue abstraction and SQS Query-compatible ElasticMQ adapter.
- Added bounded, validated job envelopes with schema version, UUID job ID, retry attempt, maximum attempts, idempotency key, and optional correlation ID.
- Added retryable/permanent failure classification, capped exponential retry delay, dead-letter handling, handler timeouts, and graceful worker shutdown.
- Added an in-memory queue/idempotency implementation for deterministic tests and a PostgreSQL-backed idempotency store for the worker process.
- Added the additive `queue_idempotency` migration and local `demo-jobs`/`dead-letter` queue configuration.
- Added a `demo.sample` handler and `npm run queue:sample` end-to-end local job path.

## Files changed

- `packages/queue/src/{types,envelope,sqs-compatible,memory,idempotency,worker,index}.ts`
- `apps/worker/src/index.ts`
- `apps/worker/src/idempotency.ts`
- `apps/worker/package.json`, `apps/worker/tsconfig.json`
- `packages/config/src/index.ts`
- `packages/database/migrations/2026071200100_queue_idempotency.sql`
- `.env.example`, `docker/elasticmq/elasticmq.conf`
- `scripts/enqueue-sample-job.mjs`, `package.json`, `package-lock.json`
- `tests/config.test.mjs`, `tests/queue.test.mjs`, `tests/scaffold.test.mjs`
- `README.md`, `docs/queue.md`, `docs/database.md`, `docker/README.md`

## Trust boundaries and sensitive data affected

- Queue messages are treated as untrusted input even though they originate from internal producers; JSON envelopes are size-limited and structurally validated before handler dispatch.
- The SQS-compatible adapter validates queue names and receipt handles, rejects credential-bearing endpoints, bounds response size, and does not expose provider response bodies in thrown errors.
- Job payloads are not written to logs or the PostgreSQL idempotency table. Dead-letter records preserve the malformed body or envelope for internal recovery, bounded to the queue message limit.
- PostgreSQL idempotency statements use parameters only; idempotency keys are bounded by both application validation and the database check constraint.
- The worker receives database credentials through the existing typed configuration boundary and never sends them to the browser or queue payload.

## Authorization model

- Queue access is process-internal and currently controlled by deployment/IAM boundaries, not end-user authorization.
- Job handlers receive a validated envelope but must still enforce workspace authorization for any tenant-owned operation they add.
- The sample job has no tenant data access and performs no external side effect.
- Production AWS deployment must use separate least-privilege task roles and per-workload queues; the local emulator does not establish IAM controls.

## Threats considered

- Oversized or malformed queue bodies causing parser/resource exhaustion.
- Queue-name/path traversal, credential leakage through endpoint URLs, malformed receipt handles, and oversized XML responses.
- Duplicate delivery, concurrent processing, worker restart, stale idempotency claims, and acknowledgement ordering.
- Retry storms, poison jobs, handler timeouts, failed retry/DLQ enqueue, and shutdown during polling or processing.
- Error and payload disclosure through logs, thrown adapter errors, or database diagnostics.
- Confusing local ElasticMQ behavior with production AWS SQS durability, encryption, redrive, or IAM semantics.

## Security controls implemented

- Queue messages and serialized envelopes are capped at 1 MiB.
- Job type, UUID, timestamp, retry bounds, idempotency key, and correlation ID are allowlisted and validated.
- Queue names are bounded to safe SQS-compatible characters; endpoint URLs must be HTTP(S) without embedded credentials.
- SQS-compatible calls use form encoding, bounded request timeouts, bounded response sizes, and generic transport errors.
- Idempotency claims use PostgreSQL leases and atomic insert/reclaim operations; completed keys prevent duplicate effects after redelivery.
- The worker completes idempotency before acknowledging successful messages and only acknowledges retry/DLQ messages after enqueue succeeds.
- Retry count and backoff are bounded; permanent and exhausted jobs go to a separate dead-letter queue.
- Handler timeouts abort the handler signal and are treated as retryable; shutdown stops polling and waits for active work before closing the database pool.
- Worker logs contain queue/job metadata only and never payloads, connection strings, or exception details.

## Security tests/checks added or run

- Queue tests cover SQS XML send/receive parsing, retries, duplicate idempotency suppression, permanent dead-lettering, timeout dead-lettering, and shutdown.
- Existing worker subprocess tests cover startup and SIGTERM exit.
- The local PostgreSQL idempotency migration applied successfully.
- The local ElasticMQ sample job was enqueued, completed by the compiled worker, and followed by a clean SIGINT shutdown.
- `npm run verify` passed: formatting, ESLint, workspace boundaries, and TypeScript checks.
- `npm test` passed with 23 executed tests and one intentionally skipped integration test in the default environment.
- `npm run test:integration` passed against the local PostgreSQL service.
- `npm audit --audit-level=high` passed with zero vulnerabilities.

## Checks not run

- Secret scanning, SAST, SBOM generation, container scanning, and IaC scanning remain deferred to TASK-010.
- No signed AWS SQS call, AWS IAM policy, queue encryption, redrive policy, or production CloudWatch alarm was tested.
- No multi-process load test or crash-recovery test was run against a real production queue service.
- No tenant-specific handler exists yet, so cross-workspace authorization tests are deferred to the first data-bearing job.

## Dependencies or infrastructure permissions added

- No external runtime dependency was added for the queue adapter; it uses the platform `fetch` API.
- The worker now depends on the existing `@supademo/database` and `@supademo/queue` workspaces.
- Added one PostgreSQL table/index and two local ElasticMQ queues.
- No AWS credentials, IAM permissions, or cloud resources were added.

## Known limitations and residual risks

- The local adapter is unsigned and emulator-specific; it must not be used as the production AWS transport.
- The worker's default idempotency store is PostgreSQL-backed, but cleanup/retention of completed claims is not yet scheduled.
- A handler cannot be forcibly terminated by JavaScript if it ignores its abort signal; handlers must honor the signal and bound all external operations.
- Retry enqueue followed by source-message deletion is intentionally protected by idempotency, but operational metrics and reconciliation belong to TASK-009.
- A future producer must validate payload schemas before enqueueing; the generic envelope validator does not know each job type's payload schema.

## Requested Claude review

Review the full diff and surrounding configuration for queue protocol correctness, request timeout/abort leaks, XML parsing and entity handling, message-size and retry-limit bypasses, dead-letter acknowledgement ordering, duplicate side effects, stale lease takeover races, SQL parameterization and migration safety, handler timeout/shutdown leaks, payload/log disclosure, production AWS adapter/IAM confusion, and missing metrics or recovery controls. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-008 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
