/**
 * Analytics Event Schemas & Versioned Event Contract — TASK-111
 */

export type AnalyticsEventKind =
  "demo.load" | "demo.start" | "step.view" | "hotspot.click" | "demo.complete";

export interface AnalyticsEvent {
  readonly v: 1;
  readonly eventId: string;
  readonly demoId: string;
  readonly kind: AnalyticsEventKind;
  readonly timestampMs: number;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export function createAnalyticsEvent(
  demoId: string,
  kind: AnalyticsEventKind,
  rawMetadata: Record<string, unknown> = {}
): AnalyticsEvent {
  // Exclude forbidden keys
  const forbidden = ["password", "token", "auth", "secret", "cookie"];
  const sanitizedMeta: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(rawMetadata)) {
    if (!forbidden.includes(key.toLowerCase())) {
      sanitizedMeta[key] = value;
    }
  }

  return Object.freeze({
    v: 1,
    eventId: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    demoId,
    kind,
    timestampMs: Date.now(),
    metadata: Object.freeze(sanitizedMeta)
  });
}
