# SECURITY REVIEW REQUEST — TASK-006

## Change summary

- Replaced the API placeholder with a versioned Node HTTP service.
- Added `/api/v1/health`, `/api/v1/readiness`, and generated `/api/v1/openapi.json` endpoints while preserving the legacy `/health` liveness alias.
- Added Zod schemas shared by runtime response validation and OpenAPI generation through `zod-to-openapi`.
- Added request IDs with allowlisted caller values and UUID fallback, strict query validation, URI/body limits, and body rejection before handlers.
- Added stable structured error responses containing only an error code, safe message, and request ID.
- Added restrictive response headers, bounded HTTP timeouts, connection limits, PostgreSQL-backed readiness, and graceful SIGINT/SIGTERM shutdown.
- Added in-process API tests and a local-service integration test that starts the compiled API against PostgreSQL.

## Files changed

- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/src/index.ts`
- `apps/api/src/app.ts`
- `apps/api/src/schemas.ts`
- `apps/api/src/openapi.ts`
- `package.json`, `package-lock.json`
- `tests/api.test.mjs`
- `tests/api.integration.test.mjs`
- `tests/scaffold.test.mjs`
- `README.md`, `docs/api.md`

## Trust boundaries and sensitive data affected

- HTTP request methods, URLs, headers, query strings, content-length, and transfer-encoding are untrusted inputs.
- The API process reads database credentials only through the TASK-004 typed configuration boundary and passes them to the TASK-005 pool; API responses and errors do not expose them.
- Readiness crosses the API-to-PostgreSQL boundary through the shared health query and reports only status/latency.
- OpenAPI output is generated from local Zod schemas and contains no runtime configuration or secret values.
- Request IDs can be caller-provided but are constrained to a bounded, printable allowlist before being echoed.

## Authorization model

- The baseline endpoints are intentionally public operational endpoints with no tenant data access.
- No creator, viewer, workspace, or protected resource handler was added.
- Future authenticated endpoints must add identity, workspace scope, and action-specific authorization before route handlers are registered.

## Threats considered

- Request smuggling/resource exhaustion through oversized URIs, bodies, headers, or long-lived connections.
- Invalid query and request metadata reaching route handlers.
- Reflected header injection through caller-provided request IDs.
- SQL/driver/internal error disclosure through readiness and unexpected failures.
- OpenAPI drift from runtime response schemas.
- Liveness incorrectly depending on PostgreSQL, or readiness incorrectly reporting healthy without a real dependency check.
- Shutdown leaking database pool clients or hanging indefinitely on open connections.
- API responses being framed, cached, or interpreted as executable content by browsers.
- Error handling recursively failing after response headers were already sent.

## Security controls implemented

- Request URIs are capped at 8 KiB and request bodies at 1 MiB.
- The current read-only baseline rejects non-empty bodies and chunked transfer bodies before any handler executes.
- Strict Zod validation rejects unknown query parameters.
- Request IDs are capped at 128 characters and limited to `[A-Za-z0-9._:-]`; invalid values are replaced with UUIDs.
- All errors use stable, bounded codes/messages and include the validated request ID; stack traces, SQL, and driver errors are not returned.
- Liveness runs without dependencies; readiness invokes the real PostgreSQL health query and returns `503` when unavailable.
- Responses set `Cache-Control: no-store`, restrictive CSP, `nosniff`, `no-referrer`, and `X-Frame-Options: DENY`.
- Node HTTP timeouts and maximum header count are bounded.
- Shutdown stops accepting connections, waits up to ten seconds, closes the database pool, and reports timeout/failure with generic structured logs.
- Zod response schemas are used both when sending responses and when generating the OpenAPI contract.
- API package imports server-only config/database packages; no browser package imports them.

## Security tests/checks added or run

- In-process API tests cover request IDs, versioned health, readiness, generated OpenAPI, strict query rejection, 405 responses, and safe dependency failures.
- Existing scaffold tests cover API startup, 404 structured errors, invalid configuration ports, and worker shutdown.
- Local integration test started the compiled API against the local PostgreSQL service and received `200` readiness.
- `npm run verify` passed: formatting, ESLint, workspace boundaries, and TypeScript checks.
- `npm test` passed with 17/17 executed tests and one intentionally skipped integration test when local environment variables were absent.
- `npm run test:integration` passed with local `DATABASE_URL` and `REDIS_URL` supplied.
- `npm audit --omit=dev` reported 0 vulnerabilities.

## Checks not run

- Secret scanning, SAST beyond ESLint, container scanning, SBOM generation, and IaC scanning remain deferred to TASK-010.
- No authenticated endpoint or tenant authorization integration test was added because protected API routes are deferred to later tasks.
- No load, slow-client, proxy, HTTP/2, or production ALB behavior test was run.
- No live AWS deployment or production readiness probe was run.

## Dependencies or infrastructure permissions added

- `zod@4.4.3`
- `@asteasolutions/zod-to-openapi@8.5.0`
- Internal `@supademo/database` API dependency.
- No cloud resources, IAM permissions, credentials, or external API calls were added.

## Known limitations and residual risks

- The service is still a low-level Node HTTP baseline; future route registration must preserve the validation/error middleware ordering.
- The current API has no authentication, rate limiting, CORS policy, audit logging, metrics, or distributed tracing; those belong to later tasks and must not be inferred from the health endpoints.
- Request bodies are rejected rather than parsed because no mutating API route exists yet. The first body-accepting route must add a bounded content-type parser, schema, authorization, idempotency policy, and negative tests.
- Readiness checks PostgreSQL only. Redis, object storage, queues, and email dependencies are not yet application dependencies for this API task.
- The integration test intentionally skips without local configuration; CI must run it with isolated services once the integration environment is established.

## Requested Claude review

Review the full diff and surrounding configuration for request-limit bypasses, malformed URL/header handling, request-ID trust issues, body-validation gaps, error disclosure, response-header mistakes, OpenAPI/runtime drift, readiness semantics, pool/shutdown leaks, dependency risk, missing authentication boundaries, and accidental secret exposure. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-006 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
