import assert from "node:assert/strict";
import { once } from "node:events";
import test from "node:test";
import { createApiServer } from "../apps/api/dist/app.js";
import {
  createHookedTracer,
  createJsonLogger,
  getCorrelationContext,
  InMemoryMetrics,
  protectLogger,
  withCorrelationContext
} from "../packages/observability/dist/index.js";

test("structured logger propagates correlation context and redacts secrets and personal data", async () => {
  const lines = [];
  const logger = createJsonLogger({
    service: "test",
    now: () => "2026-01-01T00:00:00.000Z",
    sink: { write: (line) => lines.push(line) }
  });

  await withCorrelationContext(
    { correlationId: "corr-001", requestId: "req-001", workspaceId: "workspace-001" },
    async () => {
      assert.equal(getCorrelationContext().correlationId, "corr-001");
      logger.info("sample_event", {
        email: "person@example.com",
        password: "do-not-log",
        nested: { authorization: "Bearer do-not-log" },
        count: 2
      });
    }
  );

  const record = JSON.parse(lines[0]);
  assert.equal(record.correlationId, "corr-001");
  assert.equal(record.requestId, "req-001");
  assert.equal(record.email, "[REDACTED]");
  assert.equal(record.password, "[REDACTED]");
  assert.equal(record.nested.authorization, "[REDACTED]");
  assert.doesNotMatch(lines[0], /person@example\.com|do-not-log/u);
});

test("logging, metrics, and tracing failures do not interrupt application work", () => {
  const unsafeLogger = protectLogger({
    debug: () => {
      throw new Error("sink down");
    },
    info: () => {
      throw new Error("sink down");
    },
    warn: () => {
      throw new Error("sink down");
    },
    error: () => {
      throw new Error("sink down");
    }
  });
  assert.doesNotThrow(() => unsafeLogger.error("request_failed", { password: "secret" }));

  const metrics = new InMemoryMetrics();
  metrics.increment("http.requests", 1, { route: "/health" });
  metrics.observe("http.duration_ms", 12, { route: "/health" });
  assert.equal(metrics.snapshot().counters["http.requests|route=/health"], 1);
  assert.equal(metrics.snapshot().observations["http.duration_ms|route=/health"].count, 1);

  const tracer = createHookedTracer({
    onStart: () => {
      throw new Error("exporter down");
    },
    onEnd: () => {
      throw new Error("exporter down");
    }
  });
  assert.doesNotThrow(() => {
    const span = tracer.startSpan("sample", { "correlation.id": "corr-001" });
    span.recordException(new Error("internal detail"));
    span.end("error");
  });
});

test("API propagates correlation IDs and remains available when observability sinks fail", async (context) => {
  const lines = [];
  const server = createApiServer({
    checkDatabaseHealth: async () => ({ healthy: true, latencyMs: 1 }),
    logger: {
      info: (message, fields) => lines.push(JSON.stringify({ message, fields })),
      debug: () => undefined,
      warn: () => undefined,
      error: () => undefined
    }
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  context.after(async () => {
    server.close();
    await once(server, "close");
  });

  const address = server.address();
  assert.equal(typeof address, "object");
  const response = await fetch(`http://127.0.0.1:${address.port}/api/v1/health`, {
    headers: { "x-correlation-id": "corr-api-001" }
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-correlation-id"), "corr-api-001");
  const requestLog = lines
    .map((line) => JSON.parse(line))
    .find((entry) => entry.message === "http_request");
  assert.equal(requestLog.fields.correlationId, "corr-api-001");
});
