# SECURITY REVIEW REQUEST — TASK-009

## Change summary

- Added the dependency-free `@supademo/observability` package with structured JSON logging, recursive redaction, async correlation context, in-memory metrics, protected telemetry wrappers, and exporter-based tracing hooks.
- Added API request instrumentation with `X-Correlation-ID` propagation, request metrics, `http.server` spans, and structured request/error logs.
- Added worker job metrics, spans, and correlation-aware structured logs while preserving the queue package boundary.
- Added a frontend error-reporting interface connected to the Next.js error boundary; the default reporter is intentionally a no-op until an approved backend is wired.
- Added local observability documentation and regression tests for redaction, telemetry failure isolation, correlation propagation, metrics, tracing, API behavior, and worker job context.

## Files changed

- `packages/observability/package.json`
- `packages/observability/tsconfig.json`
- `packages/observability/src/{types,context,redaction,logger,metrics,tracing,index}.ts`
- `apps/api/package.json`, `apps/api/tsconfig.json`, `apps/api/src/{app,index}.ts`
- `apps/worker/package.json`, `apps/worker/tsconfig.json`, `apps/worker/src/index.ts`
- `packages/queue/src/{types,worker,index}.ts`
- `apps/web/app/error.tsx`, `apps/web/src/lib/error-reporting.ts`
- `tsconfig.json`, `scripts/check-boundaries.mjs`, `package-lock.json`, `README.md`
- `tests/observability.test.mjs`, `tests/queue.test.mjs`
- `docs/observability.md`

## Trust boundaries and sensitive data affected

- HTTP headers, paths, job metadata, error objects, telemetry attributes, and logger fields are untrusted or potentially sensitive.
- The logger redacts keys associated with credentials, authorization, cookies, database/Redis URLs, email addresses, IP addresses, payloads, request/response bodies, and stack traces before JSON serialization.
- Redaction bounds object depth, key count, array count, and string length, and handles circular/unserializable values without throwing.
- Metric names, label names, and label values are bounded; labels matching personal-data or credential patterns are replaced with `[REDACTED]`.
- Trace attributes are redacted and bounded before exporters receive them; exception recording does not serialize exception messages or stacks.
- Frontend error events include only bounded name/message, component, digest, and pathname. Query strings, stacks, request bodies, and tokens are excluded.
- Correlation IDs are allowlisted, bounded, and never used as authorization evidence.

## Authorization model

- Observability has no authority to grant access, change tenant state, or make product decisions.
- Workspace, user, demo, and job metadata must be added only by already-authorized server code; the frontend reporter cannot submit privileged actions.
- Future telemetry exporters must use least-privilege credentials and must not expose raw logs or trace payloads to browsers.

## Threats considered

- Secret and personal-data leakage through logs, metrics labels, trace attributes, error messages, and correlation headers.
- Log/telemetry sink outages turning into request or job failures.
- Circular objects, BigInt, invalid dates, non-finite numbers, oversized nested structures, and malicious control characters causing serializer failures.
- High-cardinality or attacker-controlled metric labels causing memory/monitoring exhaustion.
- Correlation-ID header injection or unbounded propagation.
- Trace exporter failures, duplicate span endings, and exception detail disclosure.
- Frontend error reporting becoming a new network exfiltration path.
- Request query strings or job payloads being accidentally included in diagnostics.

## Security controls implemented

- All JSON logger writes are guarded and catch sink/serialization errors.
- API, worker, metrics, and tracer adapters use protected wrappers so telemetry failures cannot interrupt work.
- Correlation IDs are restricted to `[A-Za-z0-9._:-]` and capped at 128 characters; invalid values fall back to the request ID or a generated ID.
- API logs use the parsed pathname, method, status, duration, request ID, and correlation ID rather than the raw URL.
- Worker logs and spans contain queue/job metadata and correlation IDs but never job payloads or handler error messages.
- Metrics use bounded names and labels and redact sensitive label keys.
- Frontend error capture is injectable and no-op by default; the event sanitizer omits stack traces and URL query data.
- Tracing is an exporter hook, not an automatic external network client; production SDK wiring remains an explicit deployment decision.

## Security tests/checks added or run

- Redaction tests prove password, email, authorization, and nested secret values are absent from serialized logs.
- Tests prove throwing log sinks, metric paths, and trace exporters do not interrupt application code.
- API tests prove correlation response headers and structured request logs while observability sinks fail safely.
- Worker tests prove correlation IDs reach logs, metrics, and job spans.
- `npm run verify` passed: formatting, ESLint, workspace boundaries, and TypeScript checks.
- `npm test` passed with 27 executed tests and one intentionally skipped integration test.
- `npm run test:integration` passed against the local PostgreSQL service.
- `npm audit --audit-level=high` passed with zero vulnerabilities.

## Checks not run

- Secret scanning, SAST, SBOM generation, container scanning, IaC scanning, and license policy checks remain deferred to TASK-010.
- No external OpenTelemetry collector, CloudWatch exporter, frontend error SaaS, or production log sink was contacted.
- No load test for high-cardinality telemetry or telemetry backpressure was run.

## Dependencies or infrastructure permissions added

- Added the internal `@supademo/observability` workspace with no runtime third-party dependencies.
- No AWS credentials, IAM permissions, external telemetry endpoints, or cloud resources were added.

## Known limitations and residual risks

- In-memory metrics are process-local and reset on restart; production aggregation and alarms remain deployment work.
- Trace hooks do not yet implement W3C trace-context propagation or an OpenTelemetry SDK exporter; correlation IDs provide the current cross-process linkage.
- Frontend error reporting has no transport until an approved sink is configured; errors are not silently sent to an unreviewed provider.
- Redaction is key-based and cannot guarantee that a future arbitrary value with a misleading key is harmless; new fields require review and tests.
- Logging user/workspace identifiers is intentionally limited to server-provided metadata and must be reviewed when authentication and tenant routes are introduced.

## Requested Claude review

Review the full diff for secret/PII leakage, redaction bypasses, circular-object and serialization failures, metric cardinality/resource exhaustion, correlation-header trust mistakes, trace attribute disclosure, exporter failure behavior, client-side error exfiltration, production OpenTelemetry/CloudWatch wiring assumptions, and API/worker instrumentation paths that could change request/job semantics. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

### Status

Pending independent Claude review. Do not mark TASK-009 complete in `TASKS.md` until BLOCKER/HIGH findings are resolved or explicitly accepted by an authorized human.
