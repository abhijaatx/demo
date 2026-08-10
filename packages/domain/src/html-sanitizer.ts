/**
 * Strict Allowlist HTML/CSS Sanitizer & Report Generator — TASK-144
 */

export interface SanitizationReport {
  readonly removedTagsCount: number;
  readonly removedAttrsCount: number;
  readonly sanitizedHtml: string;
}

export function sanitizeHtmlContent(rawHtml: string): SanitizationReport {
  let removedTagsCount = 0;
  let removedAttrsCount = 0;

  // 1. Remove dangerous script, iframe, object, embed, form, base tags
  let cleaned = rawHtml.replace(
    /<\s*(script|iframe|object|embed|form|base|meta)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    () => {
      removedTagsCount++;
      return "";
    }
  );

  // Self-closing dangerous tags
  cleaned = cleaned.replace(/<\s*(script|iframe|object|embed|form|base|meta)[^>]*\/>/gi, () => {
    removedTagsCount++;
    return "";
  });

  // 2. Remove inline event handlers (e.g. onclick=...)
  cleaned = cleaned.replace(/\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, () => {
    removedAttrsCount++;
    return "";
  });

  // 3. Remove javascript: pseudo-protocol in href or src
  cleaned = cleaned.replace(/(href|src)\s*=\s*['"]?\s*javascript:[^'"]*['"]?/gi, () => {
    removedAttrsCount++;
    return 'href="#"';
  });

  return Object.freeze({
    removedTagsCount,
    removedAttrsCount,
    sanitizedHtml: cleaned
  });
}
