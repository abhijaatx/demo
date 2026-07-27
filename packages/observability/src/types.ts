export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogValue =
  string | number | boolean | null | readonly LogValue[] | { readonly [key: string]: LogValue };

export interface LogFields {
  readonly [key: string]: unknown;
}

export interface CorrelationContext {
  readonly correlationId: string;
  readonly requestId?: string;
  readonly workspaceId?: string;
  readonly userId?: string;
  readonly demoId?: string;
  readonly jobId?: string;
}

export interface Logger {
  debug(message: string, fields?: LogFields): void;
  info(message: string, fields?: LogFields): void;
  warn(message: string, fields?: LogFields): void;
  error(message: string, fields?: LogFields): void;
}

export interface MetricLabels {
  readonly [key: string]: string;
}

export interface Metrics {
  increment(name: string, value?: number, labels?: MetricLabels): void;
  observe(name: string, value: number, labels?: MetricLabels): void;
}

export type SpanStatus = "ok" | "error" | "unset";

export type SpanAttribute = string | number | boolean;

export interface Span {
  setAttribute(name: string, value: SpanAttribute): void;
  recordException(error: unknown): void;
  end(status?: SpanStatus): void;
}

export interface Tracer {
  startSpan(name: string, attributes?: Readonly<Record<string, SpanAttribute>>): Span;
}
