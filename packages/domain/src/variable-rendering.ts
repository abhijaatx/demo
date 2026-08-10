/**
 * Dynamic Template Variable Parser & XSS-Safe Token Renderer — TASK-131
 */

export function escapeHtml(unsafeText: string): string {
  return unsafeText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderTemplateTokens(
  templateText: string,
  variables: Record<string, string> = {},
  fallbacks: Record<string, string> = {}
): string {
  return templateText.replace(
    /\{\{\s*([a-zA-Z0-9_]+)(?:\s*\|\s*(?:"([^"]*)"|([^}]*?)))?\s*\}\}/g,
    (_match, tokenKey, quotedFallback, plainFallback) => {
      const fallbackText = quotedFallback ?? plainFallback?.trim() ?? "";
      const rawVal = variables[tokenKey] ?? fallbacks[tokenKey] ?? "";
      return escapeHtml(rawVal || fallbackText);
    }
  );
}

/**
 * Resolve tokens for React text nodes. React escapes the returned string for
 * its destination context, so this helper deliberately returns plain text;
 * callers must never place the result in an HTML sink.
 */
export function resolveTemplateTokens(
  templateText: string,
  variables: Record<string, string> = {},
  fallbacks: Record<string, string> = {}
): string {
  return templateText
    .slice(0, 10_000)
    .replace(
      /\{\{\s*([a-zA-Z0-9_]+)(?:\s*\|\s*(?:"([^"]*)"|([^}]*?)))?\s*\}\}/g,
      (_match, tokenKey, quotedFallback, plainFallback) => {
        const fallbackText = quotedFallback ?? plainFallback?.trim() ?? "";
        const rawVal = variables[tokenKey] ?? fallbacks[tokenKey] ?? "";
        return rawVal || fallbackText;
      }
    );
}
