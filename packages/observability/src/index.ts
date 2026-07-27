export const packageName = "@supademo/observability" as const;

export {
  createCorrelationId,
  getCorrelationContext,
  normalizeCorrelationId,
  withCorrelationContext
} from "./context.js";
export {
  createJsonLogger,
  noopLogger,
  protectLogger,
  type JsonLoggerOptions,
  type LogSink
} from "./logger.js";
export { InMemoryMetrics, noopMetrics, protectMetrics, type MetricsSnapshot } from "./metrics.js";
export { redactLogFields, safeString } from "./redaction.js";
export {
  createHookedTracer,
  noopTracer,
  protectTracer,
  type SpanData,
  type SpanExporter
} from "./tracing.js";
export type {
  CorrelationContext,
  LogFields,
  LogLevel,
  LogValue,
  Logger,
  MetricLabels,
  Metrics,
  Span,
  SpanAttribute,
  SpanStatus,
  Tracer
} from "./types.js";
