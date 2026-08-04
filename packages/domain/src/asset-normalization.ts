/**
 * Asset & Style Normalization for Sandboxed HTML Clones — TASK-143
 */

export function normalizeCssAssetUrls(
  cssContent: string,
  cdnPrefix = "https://cdn.supademo.com/assets/"
): string {
  return cssContent.replace(/url\(\s*['"]?([^'")]+)['"]?\s*\)/gi, (_match, rawUrl) => {
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith("data:") || trimmed.startsWith(cdnPrefix)) {
      return `url("${trimmed}")`;
    }
    const cleanFilename = trimmed.split("/").pop() || "asset";
    return `url("${cdnPrefix}${cleanFilename}")`;
  });
}
