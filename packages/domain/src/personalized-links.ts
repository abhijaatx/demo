/**
 * Personalized Demo Links & URL Variable Allowlisting — TASK-132
 *
 * Supademo variables are deliberately small, explicit, and URL-safe. The
 * viewer only accepts keys that the author has allowlisted, and values are
 * bounded before they are rendered by React.
 */

import { parseShareLinkBase, serializeShareLinkBase } from "./share-link.js";

export const PERSONALIZATION_VARIABLE_LIMIT = 12;
export const PERSONALIZATION_VARIABLE_NAME_LIMIT = 32;
export const PERSONALIZATION_VALUE_LIMIT = 160;

const VARIABLE_NAME_PATTERN = /^[a-z][a-z0-9_]{0,31}$/i;

export interface DemoPersonalization {
  readonly enabled: boolean;
  readonly allowlist: readonly string[];
  readonly fallbacks: Readonly<Record<string, string>>;
}

export const DEFAULT_DEMO_PERSONALIZATION: DemoPersonalization = Object.freeze({
  enabled: true,
  allowlist: Object.freeze(["name", "role", "company", "email"]),
  fallbacks: Object.freeze({})
});

function normalizeVariableName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const name = value.trim().toLowerCase().slice(0, PERSONALIZATION_VARIABLE_NAME_LIMIT);
  return VARIABLE_NAME_PATTERN.test(name) ? name : null;
}

function boundedValue(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, PERSONALIZATION_VALUE_LIMIT) : "";
}

export function parseDemoPersonalization(input: unknown): DemoPersonalization {
  const raw = input && typeof input === "object" ? (input as Record<string, unknown>) : {};
  const rawAllowlist = Array.isArray(raw["allowlist"]) ? raw["allowlist"] : [];
  const allowlist: string[] = [];
  for (const candidate of rawAllowlist) {
    const normalized = normalizeVariableName(candidate);
    if (normalized && !allowlist.includes(normalized)) allowlist.push(normalized);
    if (allowlist.length >= PERSONALIZATION_VARIABLE_LIMIT) break;
  }
  const effectiveAllowlist =
    allowlist.length > 0 ? allowlist : [...DEFAULT_DEMO_PERSONALIZATION.allowlist];
  const rawFallbacks =
    raw["fallbacks"] && typeof raw["fallbacks"] === "object"
      ? (raw["fallbacks"] as Record<string, unknown>)
      : {};
  const fallbacks: Record<string, string> = {};
  for (const name of effectiveAllowlist) {
    const value = boundedValue(rawFallbacks[name]);
    if (value) fallbacks[name] = value;
  }

  return Object.freeze({
    enabled: raw["enabled"] !== false,
    allowlist: Object.freeze(effectiveAllowlist),
    fallbacks: Object.freeze(fallbacks)
  });
}

export interface PersonalizedLinkConfig {
  readonly linkId: string;
  readonly demoId: string;
  readonly variables: Readonly<Record<string, string>>;
  readonly allowlist: readonly string[];
  readonly expiresAtMs?: number;
}

/** Return the token names used by an authoring surface. */
export function extractTemplateVariableNames(texts: readonly string[]): readonly string[] {
  const found: string[] = [];
  const tokenPattern = /\{\{\s*([a-z][a-z0-9_]*)/gi;
  for (const text of texts.slice(0, 200)) {
    if (typeof text !== "string") continue;
    tokenPattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = tokenPattern.exec(text)) !== null) {
      const name = normalizeVariableName(match[1]);
      if (name && !found.includes(name)) found.push(name);
      if (found.length >= PERSONALIZATION_VARIABLE_LIMIT) break;
    }
    if (found.length >= PERSONALIZATION_VARIABLE_LIMIT) break;
  }
  return Object.freeze(found);
}

export function extractPersonalizedVariablesFromUrl(
  queryString: string,
  allowlist: readonly string[]
): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};

  const allowSet = new Set(
    allowlist.map(normalizeVariableName).filter((value): value is string => Boolean(value))
  );

  params.forEach((value, key) => {
    const rawKey = key.trim().toLowerCase();
    const cleanKey = rawKey.startsWith("v_") ? rawKey.slice(2) : rawKey;
    if (allowSet.has(cleanKey) && Object.keys(result).length < PERSONALIZATION_VARIABLE_LIMIT) {
      result[cleanKey] = boundedValue(value);
    }
  });

  return Object.freeze(result);
}

export function generatePersonalizedEmbedUrl(
  baseUrl: string,
  variables: Record<string, string>,
  allowlist: readonly string[]
): string {
  const { relative, url } = parseShareLinkBase(baseUrl);
  const allowSet = new Set(
    allowlist.map(normalizeVariableName).filter((value): value is string => Boolean(value))
  );

  Object.entries(variables).forEach(([k, v]) => {
    const cleanKey = normalizeVariableName(k);
    const value = boundedValue(v);
    if (cleanKey && allowSet.has(cleanKey) && value) {
      url.searchParams.set(`v_${cleanKey}`, value);
    }
  });

  return serializeShareLinkBase(url, relative);
}
