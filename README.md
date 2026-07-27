# Supademo-style platform

This repository contains a modular TypeScript foundation for an interactive demo platform. The implementation sequence lives in [TASKS.md](./TASKS.md); security and UI requirements live in [AGENTS.md](./AGENTS.md) and [UI_REQUIREMENTS.md](./UI_REQUIREMENTS.md).

## Prerequisites

- Node.js 20.20.x
- npm 10.8.x

## Bootstrap

```bash
npm install
npm run verify
```

`npm run verify` checks workspace boundaries and compiles every project using TypeScript project references. CI details, scanner ownership, and local reproduction commands are documented in [docs/ci.md](./docs/ci.md).

## Quality workflow

```bash
npm run format:check
npm run lint
npm run check:boundaries
npm run typecheck
npm test
npm audit
```

Use `npm run format` to apply Prettier formatting to source, tests, scripts, configuration, and contributor documentation. Commit messages follow Conventional Commits and can be checked with `npm run check:commit -- .git/COMMIT_EDITMSG`.

## Local service stack

Task 003 provides PostgreSQL, Redis, MinIO, ElasticMQ, and Mailpit through Docker Compose:

```bash
npm run stack:up
npm run stack:check
npm run stack:status
```

Service endpoints, local credentials, inspection commands, and the destructive reset procedure are documented in [docker/README.md](./docker/README.md). All published ports bind to localhost only.

## Configuration

Copy `.env.example` to `.env` for local API and worker startup. Configuration is validated at process startup; malformed values or missing local credentials fail fast without printing secret values. See [docs/configuration.md](./docs/configuration.md) for the local environment and AWS Secrets Manager/Parameter Store boundaries.

## Run the placeholders

Build once before starting a process:

```bash
npm run build
```

In separate terminals:

```bash
npm run start:web
npm run start:api
npm run start:worker
```

The web placeholder is available at `http://127.0.0.1:3000`. The API exposes liveness at `http://127.0.0.1:3001/api/v1/health`, dependency readiness at `/api/v1/readiness`, and the generated OpenAPI document at `/api/v1/openapi.json`. The legacy `/health` liveness alias remains available. The API binds to the configured host only.

The worker consumes the configured SQS-compatible queue and records idempotency claims in PostgreSQL. Apply migrations first, then use the sample job in separate terminals:

```bash
npm run db:migrate
npm run start:worker
npm run queue:sample
```

The worker retries transient failures with bounded backoff, sends exhausted or permanent jobs to `dead-letter`, and drains active work during SIGTERM/SIGINT shutdown. See [docs/queue.md](./docs/queue.md) for the adapter contract and failure behavior.

## Repository structure

```text
apps/
  web/                 Creator dashboard and viewer UI placeholder
  api/                 HTTP API placeholder
  worker/              General asynchronous worker placeholder
  media-worker/        Reserved media-processing application boundary
  browser-extension/   Reserved browser-capture application boundary
packages/
  ai/ analytics/ config/ database/ domain/ integrations/
  observability/ player/ queue/ storage/ ui/
scripts/
  check-boundaries.mjs Enforces workspace dependency directions
```

Applications may depend on shared packages. Shared packages may depend only on explicitly allowed lower-level packages and may never depend on applications. Cross-workspace relative imports are prohibited.

## Current scope

Application repositories and deployment automation are introduced by later tasks. PostgreSQL setup, migrations, access patterns, and recovery notes are documented in [docs/database.md](./docs/database.md); API routes and integration checks are documented in [docs/api.md](./docs/api.md); observability contracts and local operation are documented in [docs/observability.md](./docs/observability.md); CI and security gates are documented in [docs/ci.md](./docs/ci.md).
