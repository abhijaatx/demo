/**
 * Personalized Demo Links & URL Variable Allowlisting — TASK-132
 */

export interface PersonalizedLinkConfig {
  readonly linkId: string;
  readonly demoId: string;
  readonly variables: Readonly<Record<string, string>>;
  readonly allowlist: readonly string[];
  readonly expiresAtMs?: number;
}

export function extractPersonalizedVariablesFromUrl(
  queryString: string,
  allowlist: readonly string[]
): Record<string, string> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string> = {};

  const allowSet = new Set(allowlist.map((s) => s.toLowerCase()));

  params.forEach((value, key) => {
    const cleanKey = key.trim().toLowerCase();
    if (allowSet.has(cleanKey)) {
      result[cleanKey] = value.trim();
    }
  });

  return Object.freeze(result);
}

export function generatePersonalizedEmbedUrl(
  baseUrl: string,
  variables: Record<string, string>,
  allowlist: readonly string[]
): string {
  const url = new URL(baseUrl);
  const allowSet = new Set(allowlist.map((s) => s.toLowerCase()));

  Object.entries(variables).forEach(([k, v]) => {
    const cleanKey = k.trim().toLowerCase();
    if (allowSet.has(cleanKey) && v) {
      url.searchParams.set(cleanKey, v);
    }
  });

  return url.toString();
}
