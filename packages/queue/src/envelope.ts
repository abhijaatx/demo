import { randomUUID } from "node:crypto";
import { MAX_QUEUE_MESSAGE_BYTES } from "./types.js";

export interface JobEnvelope<TPayload = unknown> {
  readonly schemaVersion: 1;
  readonly jobId: string;
  readonly type: string;
  readonly createdAt: string;
  readonly attempt: number;
  readonly maxAttempts: number;
  readonly idempotencyKey: string;
  readonly payload: TPayload;
  readonly correlationId?: string;
}

export interface CreateJobEnvelopeOptions<TPayload> {
  readonly type: string;
  readonly payload: TPayload;
  readonly idempotencyKey: string;
  readonly maxAttempts?: number;
  readonly correlationId?: string;
}

export class JobEnvelopeError extends Error {
  constructor(message = "The job envelope is invalid.") {
    super(message);
    this.name = "JobEnvelopeError";
  }
}

export function createJobEnvelope<TPayload>(
  options: CreateJobEnvelopeOptions<TPayload>
): JobEnvelope<TPayload> {
  validateJobType(options.type);
  validateIdempotencyKey(options.idempotencyKey);
  const maxAttempts = options.maxAttempts ?? 3;
  validateInteger(maxAttempts, 1, 10, "maxAttempts");
  if (options.correlationId !== undefined) {
    validateCorrelationId(options.correlationId);
  }

  const base = {
    schemaVersion: 1 as const,
    jobId: randomUUID(),
    type: options.type,
    createdAt: new Date().toISOString(),
    attempt: 1,
    maxAttempts,
    idempotencyKey: options.idempotencyKey,
    payload: options.payload
  };
  if (options.correlationId === undefined) {
    return base;
  }
  return { ...base, correlationId: options.correlationId };
}

export function serializeJobEnvelope<TPayload>(envelope: JobEnvelope<TPayload>): string {
  const body = JSON.stringify(envelope);
  if (body === undefined || byteLength(body) > MAX_QUEUE_MESSAGE_BYTES) {
    throw new JobEnvelopeError("The serialized job envelope is too large.");
  }
  return body;
}

export function parseJobEnvelope(body: string): JobEnvelope<unknown> {
  if (byteLength(body) > MAX_QUEUE_MESSAGE_BYTES) {
    throw new JobEnvelopeError("The job message is too large.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body) as unknown;
  } catch {
    throw new JobEnvelopeError();
  }
  if (!isRecord(parsed)) {
    throw new JobEnvelopeError();
  }

  if (parsed["schemaVersion"] !== 1) {
    throw new JobEnvelopeError("The job schema version is unsupported.");
  }
  const jobId = requiredString(parsed["jobId"], "jobId");
  if (!UUID_PATTERN.test(jobId)) {
    throw new JobEnvelopeError("The job ID is invalid.");
  }
  const type = requiredString(parsed["type"], "type");
  validateJobType(type);
  const createdAt = requiredString(parsed["createdAt"], "createdAt");
  if (Number.isNaN(Date.parse(createdAt))) {
    throw new JobEnvelopeError("The job creation time is invalid.");
  }
  const attempt = requiredInteger(parsed["attempt"], "attempt", 1, 10);
  const maxAttempts = requiredInteger(parsed["maxAttempts"], "maxAttempts", 1, 10);
  if (attempt > maxAttempts) {
    throw new JobEnvelopeError("The job attempt exceeds its retry limit.");
  }
  const idempotencyKey = requiredString(parsed["idempotencyKey"], "idempotencyKey");
  validateIdempotencyKey(idempotencyKey);
  if (!Object.hasOwn(parsed, "payload")) {
    throw new JobEnvelopeError("The job payload is required.");
  }
  const correlationId = parsed["correlationId"];
  if (correlationId !== undefined) {
    if (typeof correlationId !== "string") {
      throw new JobEnvelopeError("The correlation ID is invalid.");
    }
    validateCorrelationId(correlationId);
  }

  const envelope: JobEnvelope<unknown> = {
    schemaVersion: 1,
    jobId,
    type,
    createdAt,
    attempt,
    maxAttempts,
    idempotencyKey,
    payload: parsed["payload"]
  };
  if (correlationId === undefined) {
    return envelope;
  }
  return { ...envelope, correlationId };
}

export function incrementAttempt<TPayload>(envelope: JobEnvelope<TPayload>): JobEnvelope<TPayload> {
  if (envelope.attempt >= envelope.maxAttempts) {
    throw new JobEnvelopeError("The job has no remaining retry attempts.");
  }
  return { ...envelope, attempt: envelope.attempt + 1 };
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new JobEnvelopeError(`The ${field} is required.`);
  }
  return value;
}

function requiredInteger(value: unknown, field: string, minimum: number, maximum: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new JobEnvelopeError(`The ${field} must be an integer.`);
  }
  validateInteger(value, minimum, maximum, field);
  return value;
}

function validateInteger(value: number, minimum: number, maximum: number, field: string): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new JobEnvelopeError(`The ${field} must be between ${minimum} and ${maximum}.`);
  }
}

function validateJobType(value: string): void {
  if (!/^[a-z0-9][a-z0-9._-]{0,79}$/u.test(value)) {
    throw new JobEnvelopeError("The job type is invalid.");
  }
}

function validateIdempotencyKey(value: string): void {
  if (!/^[A-Za-z0-9._:-]{1,200}$/u.test(value)) {
    throw new JobEnvelopeError("The idempotency key is invalid.");
  }
}

function validateCorrelationId(value: string): void {
  if (!/^[A-Za-z0-9._:-]{1,128}$/u.test(value)) {
    throw new JobEnvelopeError("The correlation ID is invalid.");
  }
}

function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
