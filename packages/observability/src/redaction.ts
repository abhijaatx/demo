import type { LogFields, LogValue } from "./types.js";

const MAX_DEPTH = 6;
const MAX_KEYS = 100;
const MAX_ARRAY_ITEMS = 100;
const MAX_STRING_LENGTH = 2_000;
const SENSITIVE_KEY_PATTERN =
  /(?:password|passphrase|secret|token|authorization|cookie|api[-_]?key|private[-_]?key|client[-_]?secret|database|redis|email|ip|user[-_]?agent|payload|request[-_]?body|response[-_]?body|stack)/iu;

export function redactLogFields(fields: LogFields): Readonly<Record<string, LogValue>> {
  return redactObject(fields, new WeakSet<object>(), 0);
}

export function safeString(value: unknown, maximumLength = MAX_STRING_LENGTH): string {
  if (typeof value !== "string") {
    return "[REDACTED]";
  }
  return value.length > maximumLength ? `${value.slice(0, maximumLength)}…` : value;
}

function redactObject(
  value: Record<string, unknown>,
  seen: WeakSet<object>,
  depth: number
): Readonly<Record<string, LogValue>> {
  if (depth > MAX_DEPTH) {
    return { value: "[TRUNCATED]" };
  }
  if (seen.has(value)) {
    return { value: "[CIRCULAR]" };
  }
  seen.add(value);
  const entries = Object.entries(value).slice(0, MAX_KEYS);
  const redacted = Object.fromEntries(
    entries.map(([key, entry]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? "[REDACTED]" : redactValue(entry, seen, depth + 1)
    ])
  );
  seen.delete(value);
  return redacted;
}

function redactValue(value: unknown, seen: WeakSet<object>, depth: number): LogValue {
  if (value === null || typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return safeString(value);
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : "[NON_FINITE_NUMBER]";
  }
  if (typeof value === "bigint" || typeof value === "symbol" || typeof value === "function") {
    return "[UNSERIALIZABLE]";
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "[INVALID_DATE]" : value.toISOString();
  }
  if (Array.isArray(value)) {
    if (depth > MAX_DEPTH) {
      return "[TRUNCATED]";
    }
    return value.slice(0, MAX_ARRAY_ITEMS).map((entry) => redactValue(entry, seen, depth + 1));
  }
  return redactObject(value as Record<string, unknown>, seen, depth);
}
