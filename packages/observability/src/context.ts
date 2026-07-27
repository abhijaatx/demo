import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import type { CorrelationContext } from "./types.js";

const correlationStorage = new AsyncLocalStorage<Readonly<CorrelationContext>>();
const CORRELATION_PATTERN = /^[A-Za-z0-9._:-]{1,128}$/u;

export function createCorrelationId(): string {
  return randomUUID();
}

export function normalizeCorrelationId(
  candidate: unknown,
  fallback = createCorrelationId()
): string {
  return typeof candidate === "string" && CORRELATION_PATTERN.test(candidate)
    ? candidate
    : fallback;
}

export function getCorrelationContext(): Readonly<CorrelationContext> | undefined {
  return correlationStorage.getStore();
}

export function withCorrelationContext<T>(
  context: CorrelationContext,
  operation: () => T | Promise<T>
): T | Promise<T> {
  return correlationStorage.run(Object.freeze({ ...context }), operation);
}
