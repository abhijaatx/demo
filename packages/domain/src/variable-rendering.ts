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
  return templateText.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, tokenKey) => {
    const rawVal = variables[tokenKey] ?? fallbacks[tokenKey] ?? "";
    return escapeHtml(rawVal);
  });
}
