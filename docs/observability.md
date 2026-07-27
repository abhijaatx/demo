# Observability foundation

TASK-009 adds a vendor-neutral observability layer shared by the API and worker. It is intentionally dependency-free so local development does not require an AWS account or a telemetry collector.

## Local behavior

The API and worker emit one-line JSON logs to stdout. Logs include service, level, message, request/job metadata, and correlation IDs. Sensitive keys such as passwords, tokens, authorization headers, database URLs, Redis URLs, email addresses, request bodies, and payloads are replaced with `[REDACTED]` before serialization.

The local metrics implementation keeps in-process counters and observations for tests and future exporters. It is not a durable monitoring system. The tracing implementation exposes start/end span hooks and a safe exporter boundary; it does not send data anywhere by default.

## Correlation flow

HTTP requests accept a bounded `X-Correlation-ID` value and echo it as a response header. If absent or invalid, the request ID is used. The correlation context is propagated through `AsyncLocalStorage`, API spans, request logs, and metric labels.

Job envelopes may carry the same correlation ID. Worker logs and job spans include that value alongside the job ID, queue, type, and attempt. Payloads are never logged.

```text
HTTP X-Correlation-ID
        │
        ├── API JSON log + http.server span + request metrics
        │
        └── JobEnvelope.correlationId
              └── worker JSON log + job span + queue metrics
```

## Interfaces for production wiring

`@supademo/observability` exports:

- `Logger` and `createJsonLogger`
- `Metrics` and `InMemoryMetrics`
- `Tracer`, `Span`, and `createHookedTracer`
- `withCorrelationContext` and `normalizeCorrelationId`
- redaction and protected wrappers that swallow telemetry backend failures

An AWS deployment can provide a `LogSink` backed by container stdout/CloudWatch, a `Metrics` adapter backed by CloudWatch EMF or OpenTelemetry metrics, and a `SpanExporter` backed by the OpenTelemetry SDK/collector. Those integrations must preserve the redaction and bounded-cardinality rules.

## Frontend error reporting

The web app exposes `configureFrontendErrorReporter()` and reports the Next.js error boundary through an injectable sink. The default reporter is a no-op; deployment code can connect it to an approved error service later. Events include a bounded error name/message, optional digest, component, and pathname only. Stack traces, query strings, request bodies, and tokens are not sent by the interface.

## Operating locally

```bash
npm run build
npm run verify
npm test
```

For a real API/worker correlation check, start the local stack and services, enqueue a sample job with a correlation ID in its envelope, and inspect stdout. Metrics and trace snapshots are intentionally process-local until a collector is introduced.

## Production follow-ups

- Add an OpenTelemetry SDK/exporter in the deployment layer and configure sampling, timeouts, and collector endpoints.
- Export API latency/error counters and SQS queue depth/oldest-message metrics to CloudWatch dashboards and alarms.
- Add ECS task metadata, deployment version, availability zone, and environment as low-cardinality resource attributes.
- Add log retention, access controls, and deletion policies appropriate for personal-data minimization.
- Add synthetic checks and alert routing described in `architecture.md`.
