/**
 * Secure Responsive Iframe Embed Snippet Generator — TASK-084
 */

export interface EmbedSnippetOptions {
  readonly demoId: string;
  readonly baseUrl?: string;
  readonly aspectWidth?: number;
  readonly aspectHeight?: number;
  readonly allowFullscreen?: boolean;
  readonly lazyLoad?: boolean;
}

export function generateIframeSnippet(options: EmbedSnippetOptions): string {
  const {
    demoId,
    baseUrl = "https://app.supademo.com",
    aspectWidth = 16,
    aspectHeight = 9,
    allowFullscreen = true,
    lazyLoad = true
  } = options;

  const embedUrl = `${baseUrl.replace(/\/$/, "")}/e/${encodeURIComponent(demoId)}`;
  const paddingBottomPct = ((aspectHeight / aspectWidth) * 100).toFixed(2);

  const allowAttr = allowFullscreen
    ? 'allow="fullscreen; clipboard-write"'
    : 'allow="clipboard-write"';
  const loadingAttr = lazyLoad ? 'loading="lazy"' : "";

  return `<div style="position: relative; width: 100%; padding-bottom: ${paddingBottomPct}%; height: 0; overflow: hidden; border-radius: 8px;">
  <iframe
    src="${embedUrl}"
    style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;"
    ${allowAttr}
    ${loadingAttr}
    title="Interactive Product Demo"
  ></iframe>
</div>`.trim();
}
