export const MAX_QUEUE_MESSAGE_BYTES = 1_048_576 as const;

export interface SendMessageOptions {
  readonly delaySeconds?: number;
}

export interface ReceiveMessageOptions {
  readonly maxMessages?: number;
  readonly visibilityTimeoutSeconds?: number;
  readonly waitTimeSeconds?: number;
  readonly signal?: AbortSignal;
}

export interface QueueMessage {
  readonly messageId: string;
  readonly receiptHandle: string;
  readonly body: string;
}

export interface QueueAdapter {
  send(
    queueName: string,
    body: string,
    options?: SendMessageOptions
  ): Promise<{ readonly messageId: string }>;
  receive(queueName: string, options?: ReceiveMessageOptions): Promise<readonly QueueMessage[]>;
  deleteMessage(queueName: string, receiptHandle: string): Promise<void>;
  changeVisibility(
    queueName: string,
    receiptHandle: string,
    visibilityTimeoutSeconds: number
  ): Promise<void>;
}

export interface QueueLogEvent {
  readonly message: string;
  readonly queue?: string;
  readonly jobType?: string;
  readonly attempt?: number;
  readonly jobId?: string;
  readonly correlationId?: string;
}

export interface QueueLogger {
  info(event: QueueLogEvent): void;
  warn(event: QueueLogEvent): void;
  error(event: QueueLogEvent): void;
}

export interface QueueMetrics {
  increment(name: string, value?: number, labels?: Readonly<Record<string, string>>): void;
  observe(name: string, value: number, labels?: Readonly<Record<string, string>>): void;
}

export type QueueSpanStatus = "ok" | "error" | "skipped";

export interface QueueSpan {
  setAttribute(name: string, value: string | number | boolean): void;
  recordException(error: unknown): void;
  end(status?: QueueSpanStatus): void;
}

export interface QueueTracer {
  startSpan(
    name: string,
    attributes?: Readonly<Record<string, string | number | boolean>>
  ): QueueSpan;
}

export const noopQueueLogger: QueueLogger = {
  info: () => undefined,
  warn: () => undefined,
  error: () => undefined
};

export const noopQueueMetrics: QueueMetrics = {
  increment: () => undefined,
  observe: () => undefined
};

export const noopQueueTracer: QueueTracer = {
  startSpan: () => ({
    setAttribute: () => undefined,
    recordException: () => undefined,
    end: () => undefined
  })
};

export class QueueTransportError extends Error {
  readonly status: number | undefined;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "QueueTransportError";
    this.status = status;
  }
}
