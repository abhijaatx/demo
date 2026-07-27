export const packageName = "@supademo/queue" as const;

export {
  createJobEnvelope,
  incrementAttempt,
  parseJobEnvelope,
  serializeJobEnvelope,
  JobEnvelopeError,
  type CreateJobEnvelopeOptions,
  type JobEnvelope
} from "./envelope.js";
export {
  InMemoryIdempotencyStore,
  type IdempotencyClaim,
  type IdempotencyStore
} from "./idempotency.js";
export { InMemoryQueueAdapter } from "./memory.js";
export { SqsCompatibleQueueAdapter, type SqsCompatibleQueueOptions } from "./sqs-compatible.js";
export {
  PermanentJobError,
  QueueWorker,
  RetryableJobError,
  type JobHandler,
  type QueueWorkerOptions
} from "./worker.js";
export {
  MAX_QUEUE_MESSAGE_BYTES,
  QueueTransportError,
  noopQueueMetrics,
  noopQueueTracer,
  type QueueAdapter,
  type QueueLogEvent,
  type QueueLogger,
  type QueueMetrics,
  type QueueMessage,
  type QueueSpan,
  type QueueSpanStatus,
  type QueueTracer,
  type ReceiveMessageOptions,
  type SendMessageOptions
} from "./types.js";
