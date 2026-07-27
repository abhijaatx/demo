import { ConfigurationError, loadConfig } from "@supademo/config";
import { closeDatabasePool, createDatabasePool } from "@supademo/database";
import {
  createHookedTracer,
  createJsonLogger,
  InMemoryMetrics,
  protectLogger,
  protectMetrics,
  type SpanStatus
} from "@supademo/observability";
import {
  PermanentJobError,
  QueueWorker,
  SqsCompatibleQueueAdapter,
  type JobHandler,
  type QueueLogger,
  type QueueSpanStatus,
  type QueueTracer
} from "@supademo/queue";
import { SqlIdempotencyStore } from "./idempotency.js";

async function main(): Promise<void> {
  const config = await loadConfig();
  const pool = createDatabasePool({
    connectionString: config.database.url,
    applicationName: "supademo-worker",
    onIdleClientError: () => {
      console.error(
        JSON.stringify({ level: "error", message: "worker_database_idle_client_error" })
      );
    }
  });
  const adapter = new SqsCompatibleQueueAdapter({ endpoint: config.queue.endpoint });
  const applicationLogger = createJsonLogger({ service: "worker" });
  const metrics = new InMemoryMetrics();
  const tracer = createHookedTracer();
  const worker = new QueueWorker({
    adapter,
    queueName: config.queue.name,
    deadLetterQueueName: config.queue.deadLetterName,
    handlers: new Map<string, JobHandler>([["demo.sample", sampleJobHandler]]),
    idempotencyStore: new SqlIdempotencyStore(pool, config.queue.visibilityTimeoutSeconds + 60),
    visibilityTimeoutSeconds: config.queue.visibilityTimeoutSeconds,
    pollWaitSeconds: config.queue.pollWaitSeconds,
    maxMessages: 1,
    logger: createQueueLogger(applicationLogger),
    metrics: protectMetrics(metrics),
    tracer: createQueueTracer(tracer)
  });

  let stopping = false;
  const requestShutdown = (signal: string) => {
    if (stopping) {
      return;
    }
    stopping = true;
    console.log(JSON.stringify({ level: "info", message: "worker_shutdown_requested", signal }));
    void worker.stop();
  };
  process.once("SIGINT", () => requestShutdown("SIGINT"));
  process.once("SIGTERM", () => requestShutdown("SIGTERM"));

  console.log(
    JSON.stringify({ level: "info", message: "worker_started", queue: config.queue.name })
  );
  try {
    await worker.run();
  } finally {
    await closeDatabasePool(pool);
    console.log(JSON.stringify({ level: "info", message: "worker_stopped" }));
  }
}

function createQueueLogger(logger: ReturnType<typeof createJsonLogger>): QueueLogger {
  const safeLogger = protectLogger(logger);
  return {
    info: (event) => safeLogger.info(event.message, { ...event }),
    warn: (event) => safeLogger.warn(event.message, { ...event }),
    error: (event) => safeLogger.error(event.message, { ...event })
  };
}

function createQueueTracer(tracer: ReturnType<typeof createHookedTracer>): QueueTracer {
  return {
    startSpan: (name, attributes) => {
      const span = tracer.startSpan(name, attributes);
      return {
        setAttribute: (key, value) => span.setAttribute(key, value),
        recordException: (error) => span.recordException(error),
        end: (status: QueueSpanStatus) => span.end(mapSpanStatus(status))
      };
    }
  };
}

function mapSpanStatus(status: QueueSpanStatus): SpanStatus {
  return status === "skipped" ? "ok" : status;
}

const sampleJobHandler: JobHandler = {
  async handle(job) {
    if (!isSamplePayload(job.payload)) {
      throw new PermanentJobError("The sample job payload is invalid.");
    }
    console.log(
      JSON.stringify({ level: "info", message: "sample_job_completed", jobId: job.jobId })
    );
  }
};

function isSamplePayload(value: unknown): value is { readonly message: string } {
  if (!value || typeof value !== "object" || !("message" in value)) {
    return false;
  }
  const record = value as { readonly message?: unknown };
  return typeof record.message === "string" && record.message.length <= 200;
}

function configurationErrorMessage(error: unknown): string {
  if (error instanceof ConfigurationError) {
    return error.message;
  }
  return "Worker startup failed.";
}

try {
  await main();
} catch (error) {
  console.error(configurationErrorMessage(error));
  process.exitCode = 1;
}
