import {
  incrementAttempt,
  parseJobEnvelope,
  serializeJobEnvelope,
  type JobEnvelope,
  type JobEnvelopeError
} from "./envelope.js";
import type { IdempotencyStore } from "./idempotency.js";
import {
  MAX_QUEUE_MESSAGE_BYTES,
  noopQueueLogger,
  noopQueueMetrics,
  noopQueueTracer,
  type QueueAdapter,
  type QueueLogEvent,
  type QueueLogger,
  type QueueMessage,
  type QueueMetrics,
  type QueueSpan,
  type QueueTracer
} from "./types.js";

export interface JobHandler<TPayload = unknown> {
  handle(job: JobEnvelope<TPayload>, signal: AbortSignal): Promise<void>;
}

export class PermanentJobError extends Error {
  constructor(message = "The job is not retryable.") {
    super(message);
    this.name = "PermanentJobError";
  }
}

export class RetryableJobError extends Error {
  constructor(message = "The job should be retried.") {
    super(message);
    this.name = "RetryableJobError";
  }
}

export interface QueueWorkerOptions {
  readonly adapter: QueueAdapter;
  readonly queueName: string;
  readonly deadLetterQueueName: string;
  readonly handlers: ReadonlyMap<string, JobHandler>;
  readonly idempotencyStore: IdempotencyStore;
  readonly visibilityTimeoutSeconds: number;
  readonly pollWaitSeconds: number;
  readonly jobTimeoutMs?: number;
  readonly maxMessages?: number;
  readonly logger?: QueueLogger;
  readonly metrics?: QueueMetrics;
  readonly tracer?: QueueTracer;
}

type ResolvedQueueWorkerOptions = QueueWorkerOptions &
  Required<Pick<QueueWorkerOptions, "jobTimeoutMs" | "maxMessages">>;

interface DeadLetterRecord {
  readonly schemaVersion: 1;
  readonly originalMessageId: string;
  readonly sourceQueue: string;
  readonly failedAt: string;
  readonly reason: "invalid_envelope" | "handler_failed" | "retry_exhausted";
  readonly failure: "malformed" | "permanent" | "retryable" | "timeout";
  readonly originalBody?: string;
  readonly job?: JobEnvelope;
}

export class QueueWorker {
  private readonly options: ResolvedQueueWorkerOptions;
  private readonly logger: QueueLogger;
  private readonly metrics: QueueMetrics;
  private readonly tracer: QueueTracer;
  private readonly pollAbortController = new AbortController();
  private readonly active = new Set<Promise<void>>();
  private stopping = false;

  constructor(options: QueueWorkerOptions) {
    this.options = {
      ...options,
      jobTimeoutMs: options.jobTimeoutMs ?? 60_000,
      maxMessages: options.maxMessages ?? 1
    };
    this.logger = options.logger ?? noopQueueLogger;
    this.metrics = options.metrics ?? noopQueueMetrics;
    this.tracer = options.tracer ?? noopQueueTracer;
    validateWorkerOptions(this.options);
  }

  async run(): Promise<void> {
    while (!this.stopping) {
      try {
        const count = await this.processAvailableOnce();
        if (count === 0 && this.options.pollWaitSeconds === 0) {
          await delay(100, this.pollAbortController.signal);
        }
      } catch {
        if (this.stopping) {
          break;
        }
        this.logger.error(this.event("queue_receive_failed"));
        await delay(1_000, this.pollAbortController.signal).catch(() => undefined);
      }
    }
    await Promise.all([...this.active]);
  }

  async stop(): Promise<void> {
    this.stopping = true;
    this.pollAbortController.abort();
    await Promise.all([...this.active]);
  }

  async processAvailableOnce(): Promise<number> {
    const messages = await this.options.adapter.receive(this.options.queueName, {
      maxMessages: this.options.maxMessages,
      visibilityTimeoutSeconds: this.options.visibilityTimeoutSeconds,
      waitTimeSeconds: this.options.pollWaitSeconds,
      signal: this.pollAbortController.signal
    });
    for (const message of messages) {
      const processing = this.processMessage(message);
      this.active.add(processing);
      try {
        await processing;
      } finally {
        this.active.delete(processing);
      }
    }
    return messages.length;
  }

  private async processMessage(message: QueueMessage): Promise<void> {
    let job: JobEnvelope;
    try {
      job = parseJobEnvelope(message.body);
    } catch {
      await this.deadLetter(message, {
        schemaVersion: 1,
        originalMessageId: message.messageId,
        sourceQueue: this.options.queueName,
        failedAt: new Date().toISOString(),
        reason: "invalid_envelope",
        failure: "malformed",
        originalBody: message.body.slice(0, MAX_QUEUE_MESSAGE_BYTES)
      });
      return;
    }

    const claim = await this.options.idempotencyStore.begin(job.idempotencyKey, job.jobId);
    safeIncrement(this.metrics, "queue.jobs.received", 1, {
      queue: this.options.queueName,
      job_type: job.type
    });
    const span = safeStartSpan(this.tracer, `job.${job.type}`, {
      "job.id": job.jobId,
      "job.type": job.type,
      "job.attempt": job.attempt,
      ...(job.correlationId === undefined ? {} : { "correlation.id": job.correlationId })
    });
    if (claim === "completed") {
      await this.options.adapter.deleteMessage(this.options.queueName, message.receiptHandle);
      this.logger.info(this.event("duplicate_job_discarded", job));
      safeIncrement(this.metrics, "queue.jobs.duplicates", 1, { queue: this.options.queueName });
      span.end("skipped");
      return;
    }
    if (claim === "in_progress") {
      await this.options.adapter.changeVisibility(
        this.options.queueName,
        message.receiptHandle,
        this.options.visibilityTimeoutSeconds
      );
      this.logger.info(this.event("duplicate_job_deferred", job));
      safeIncrement(this.metrics, "queue.jobs.duplicates", 1, { queue: this.options.queueName });
      span.end("skipped");
      return;
    }

    const handler = this.options.handlers.get(job.type);
    try {
      if (handler === undefined) {
        throw new PermanentJobError("No handler is registered for this job type.");
      }
      await this.runHandler(handler, job);
      await this.options.idempotencyStore.complete(job.idempotencyKey, job.jobId);
      await this.options.adapter.deleteMessage(this.options.queueName, message.receiptHandle);
      this.logger.info(this.event("job_completed", job));
      safeIncrement(this.metrics, "queue.jobs.completed", 1, {
        queue: this.options.queueName,
        job_type: job.type
      });
      span.end("ok");
    } catch (error) {
      span.recordException(error);
      await this.handleFailure(message, job, error);
      safeIncrement(this.metrics, "queue.jobs.failed", 1, {
        queue: this.options.queueName,
        job_type: job.type
      });
      span.end("error");
    }
  }

  private async runHandler(handler: JobHandler, job: JobEnvelope): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.options.jobTimeoutMs);
    timeout.unref();
    let timeoutPromiseTimer: ReturnType<typeof setTimeout> | undefined;
    try {
      const handlerPromise = handler.handle(job, controller.signal);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutPromiseTimer = setTimeout(
          () => reject(new RetryableJobError("The job timed out.")),
          this.options.jobTimeoutMs
        );
      });
      await Promise.race([handlerPromise, timeoutPromise]);
    } catch (error) {
      if (controller.signal.aborted) {
        throw new RetryableJobError("The job timed out.");
      }
      throw error;
    } finally {
      clearTimeout(timeout);
      if (timeoutPromiseTimer !== undefined) {
        clearTimeout(timeoutPromiseTimer);
      }
      controller.abort();
    }
  }

  private async handleFailure(
    message: QueueMessage,
    job: JobEnvelope,
    error: unknown
  ): Promise<void> {
    const permanent = error instanceof PermanentJobError;
    const timedOut = error instanceof RetryableJobError && error.message === "The job timed out.";
    if (!permanent && job.attempt < job.maxAttempts) {
      try {
        const nextAttempt = incrementAttempt(job);
        await this.options.adapter.send(this.options.queueName, serializeJobEnvelope(nextAttempt), {
          delaySeconds: retryDelaySeconds(job.attempt)
        });
        await this.options.idempotencyStore.release(job.idempotencyKey, job.jobId);
        await this.options.adapter.deleteMessage(this.options.queueName, message.receiptHandle);
        this.logger.warn(this.event("job_retry_scheduled", job));
      } catch {
        await this.options.idempotencyStore.release(job.idempotencyKey, job.jobId);
        this.logger.error(this.event("job_retry_enqueue_failed", job));
      }
      return;
    }

    try {
      await this.deadLetter(message, {
        schemaVersion: 1,
        originalMessageId: message.messageId,
        sourceQueue: this.options.queueName,
        failedAt: new Date().toISOString(),
        reason: permanent ? "handler_failed" : "retry_exhausted",
        failure: timedOut ? "timeout" : permanent ? "permanent" : "retryable",
        job
      });
      await this.options.idempotencyStore.release(job.idempotencyKey, job.jobId);
      this.logger.error(this.event("job_dead_lettered", job));
    } catch {
      await this.options.idempotencyStore.release(job.idempotencyKey, job.jobId);
      this.logger.error(this.event("job_dead_letter_enqueue_failed", job));
    }
  }

  private async deadLetter(message: QueueMessage, record: DeadLetterRecord): Promise<void> {
    const body = JSON.stringify(record);
    if (new TextEncoder().encode(body).byteLength > MAX_QUEUE_MESSAGE_BYTES) {
      throw new Error("The dead-letter record is too large.");
    }
    await this.options.adapter.send(this.options.deadLetterQueueName, body);
    await this.options.adapter.deleteMessage(this.options.queueName, message.receiptHandle);
  }

  private event(message: string, job?: JobEnvelope): QueueLogEvent {
    return {
      message,
      queue: this.options.queueName,
      ...(job === undefined
        ? {}
        : {
            jobType: job.type,
            attempt: job.attempt,
            jobId: job.jobId,
            correlationId: job.correlationId
          })
    };
  }
}

function safeIncrement(
  metrics: QueueMetrics,
  name: string,
  value: number,
  labels: Readonly<Record<string, string>>
): void {
  try {
    metrics.increment(name, value, labels);
  } catch {
    // Telemetry failures must not interrupt job processing.
  }
}

function safeStartSpan(
  tracer: QueueTracer,
  name: string,
  attributes: Readonly<Record<string, string | number | boolean>>
): QueueSpan {
  try {
    return tracer.startSpan(name, attributes);
  } catch {
    return noopQueueTracer.startSpan(name, attributes);
  }
}

function validateWorkerOptions(options: ResolvedQueueWorkerOptions): void {
  if (options.queueName === options.deadLetterQueueName) {
    throw new Error("The worker source and dead-letter queues must differ.");
  }
  validateInteger(options.visibilityTimeoutSeconds, 1, 43_200, "visibilityTimeoutSeconds");
  validateInteger(options.pollWaitSeconds, 0, 20, "pollWaitSeconds");
  validateInteger(options.jobTimeoutMs, 1_000, 3_600_000, "jobTimeoutMs");
  validateInteger(options.maxMessages, 1, 10, "maxMessages");
}

function validateInteger(value: number, minimum: number, maximum: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new Error(`The worker ${field} is invalid.`);
  }
}

function retryDelaySeconds(attempt: number): number {
  return Math.min(900, 2 ** Math.max(0, attempt - 1));
}

function delay(milliseconds: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true }
    );
  });
}

export type { JobEnvelopeError };
