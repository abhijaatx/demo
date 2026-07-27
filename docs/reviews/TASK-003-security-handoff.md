# SECURITY REVIEW REQUEST — TASK-003

## Change summary

- Added a pinned local Docker Compose stack for PostgreSQL, Redis, MinIO, ElasticMQ, and Mailpit.
- Added healthchecks for each long-running service and a one-shot MinIO bootstrap container that creates the four application buckets.
- Added named volumes for database, cache, object-storage, queue, and Mailpit state.
- Added local-only environment defaults, a checked-in `.env.example`, and explicit stack lifecycle commands.
- Added a local stack checker that verifies container health and the HTTP readiness endpoints.
- Documented endpoints, service-to-service connection values, persistence behavior, reset behavior, and local-only limitations.

## Files changed

- `.env.example`
- `docker/compose.yml`
- `docker/README.md`
- `docker/elasticmq/elasticmq.conf`
- `docker/minio/bootstrap.sh`
- `docker/postgres/init/001-bootstrap.sql`
- `package.json`
- `scripts/check-local-stack.mjs`
- `README.md`

## Trust boundaries and sensitive data affected

- All published ports bind to `127.0.0.1`; the stack is intended for one developer machine and is not a production deployment.
- PostgreSQL, Redis, MinIO, ElasticMQ, and Mailpit data are persisted in Docker-managed named volumes.
- Local service credentials are intentionally predictable development credentials. They are not production secrets and are documented as such.
- MinIO and ElasticMQ expose AWS-compatible local interfaces but do not establish AWS IAM, S3 public-access, KMS, or production durability controls.
- The PostgreSQL bootstrap only enables `pgcrypto`; application schema and migrations remain deferred to TASK-005.

## Authorization model

- No application authentication, authorization, tenant, public-link, or user-data behavior was added.
- Local infrastructure is reachable only from the host loopback interface or the private Compose network.
- The destructive `stack:reset` command is a repository-scoped Compose command and explicitly removes only the local project’s named volumes.

## Threats considered

- Accidental exposure of development databases, queues, object storage, or mail capture UI to the LAN.
- Accidental reuse of local credentials in AWS or production configuration.
- Data loss caused by normal container restarts.
- Healthchecks reporting success before a service can accept requests.
- MinIO bootstrap granting public bucket access or accepting writable host configuration.
- Read-only bind mounts for bootstrap/configuration files being modified by containers.
- Destructive reset commands being confused with ordinary shutdown.
- Queue configuration and message state failing to survive a normal restart.
- ElasticMQ’s expected unsigned root response being mistaken for an unavailable service.

## Security controls implemented

- Every host port is explicitly bound to `127.0.0.1`.
- Production-like services use pinned image tags rather than floating `latest` tags.
- PostgreSQL and Redis require credentials, with safe local defaults and `.env` overrides.
- MinIO uses local root credentials and private-by-default bootstrap buckets; no public policy is installed.
- Bootstrap and configuration files are mounted read-only.
- Healthchecks cover PostgreSQL, Redis authentication, MinIO readiness, ElasticMQ availability, and Mailpit readiness.
- ElasticMQ persists queue metadata and messages under its named volume.
- Mailpit persists its local database under its named volume and caps retained messages.
- `stack:down` preserves volumes while `stack:reset` is a separately named, explicitly destructive operation.
- `stack:check` validates service state and readiness without printing credentials.
- The Compose stack does not require AWS credentials or contact AWS services.

## Security tests/checks added or run

- `npm run stack:config` passed.
- `npm run stack:up` started the local services and completed MinIO bootstrap.
- `npm run stack:check` passed with all five services healthy.
- PostgreSQL and Redis persistence was verified across `stack:down` followed by `stack:up`; temporary probes were removed afterward.
- `npm run verify` passed: formatting, ESLint, workspace boundaries, and TypeScript checks.
- `npm test` passed with 5/5 tests.
- `npm audit --omit=dev` reported 0 vulnerabilities.

## Checks not run

- Container image vulnerability scanning, SBOM generation, secret scanning, SAST beyond ESLint, and IaC scanning remain deferred to TASK-010.
- Production AWS deployment, IAM, private networking, RDS/ElastiCache, S3, SES, and SQS controls were not changed and require separate infrastructure review.
- A production-like backup/restore test was not run because this stack is local-only.

## Dependencies or infrastructure permissions added

- No npm runtime dependencies were added.
- No AWS resources, IAM permissions, production secrets, cloud credentials, or external network services were added.
- Docker image references are pinned in `docker/compose.yml` and should be reviewed/scanned before CI or production-adjacent use.

## Known limitations and residual risks

- Local credentials are intentionally committed as development defaults; they must never be copied into AWS.
- Host loopback binding protects against LAN exposure but does not protect against other processes or users with access to the local Docker daemon.
- Emulators do not reproduce all AWS security, consistency, throttling, or IAM semantics.
- The stack does not yet have resource limits, image signature verification, container-level seccomp/AppArmor policy, or automated image scanning.
- Mailpit is a local email sink and must not receive real production messages or personal data.

## Requested Claude review

Review the full diff and surrounding configuration for accidental non-loopback exposure, credential leakage, unsafe Docker defaults, mutable or unpinned images, destructive reset scope, volume permission issues, insecure bucket/queue bootstrap behavior, healthcheck blind spots, emulator-to-production confusion, and missing container/IaC security controls. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-003 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
