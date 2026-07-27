import { randomUUID } from "node:crypto";
import { redactLogFields } from "./redaction.js";
import type { Span, SpanAttribute, SpanStatus, Tracer } from "./types.js";

export interface SpanData {
  readonly traceId: string;
  readonly spanId: string;
  readonly name: string;
  readonly attributes: Readonly<Record<string, SpanAttribute>>;
  readonly status: SpanStatus;
  readonly durationMs: number;
}

export interface SpanExporter {
  onStart(span: Pick<SpanData, "traceId" | "spanId" | "name" | "attributes">): void;
  onEnd(span: SpanData): void;
}

export function createHookedTracer(exporter?: SpanExporter): Tracer {
  return {
    startSpan: (name, attributes = {}) => {
      const traceId = randomUUID().replaceAll("-", "");
      const spanId = randomUUID().replaceAll("-", "").slice(0, 16);
      const startedAt = performance.now();
      const safeAttributes = redactLogFields(
        attributes as unknown as Record<string, unknown>
      ) as Record<string, SpanAttribute>;
      try {
        exporter?.onStart({
          traceId,
          spanId,
          name: name.slice(0, 128),
          attributes: safeAttributes
        });
      } catch {
        // Tracing export failures must not interrupt work.
      }
      let ended = false;
      let status: SpanStatus = "unset";
      return {
        setAttribute: (key, value) => {
          if (!ended && Object.keys(safeAttributes).length < 50) {
            safeAttributes[key.slice(0, 128)] = value;
          }
        },
        recordException: () => {
          if (!ended) {
            status = "error";
          }
        },
        end: (nextStatus = status) => {
          if (ended) {
            return;
          }
          ended = true;
          status = nextStatus;
          try {
            exporter?.onEnd({
              traceId,
              spanId,
              name: name.slice(0, 128),
              attributes: safeAttributes,
              status,
              durationMs: Math.max(0, performance.now() - startedAt)
            });
          } catch {
            // Tracing export failures must not interrupt work.
          }
        }
      } satisfies Span;
    }
  };
}

export const noopTracer: Tracer = createHookedTracer();

export function protectTracer(tracer: Tracer): Tracer {
  return {
    startSpan: (name, attributes) => {
      try {
        const span = tracer.startSpan(name, attributes);
        return {
          setAttribute: (key, value) => {
            try {
              span.setAttribute(key, value);
            } catch {
              // Ignore exporter failures.
            }
          },
          recordException: (error) => {
            try {
              span.recordException(error);
            } catch {
              // Ignore exporter failures.
            }
          },
          end: (status) => {
            try {
              span.end(status);
            } catch {
              // Ignore exporter failures.
            }
          }
        } satisfies Span;
      } catch {
        return noopTracer.startSpan(name, attributes);
      }
    }
  };
}
