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

export interface PopupEmbedSnippetOptions {
  readonly demoId: string;
  readonly sdkUrl?: string;
}

export function generatePopupEmbedSnippet(options: PopupEmbedSnippetOptions): string {
  const demoId = encodeURIComponent(options.demoId.trim().slice(0, 160)).replace(/'/g, "%27");
  const defaultSdkUrl = "https://script.supademo.com/supademo.js";
  const sdkUrl = options.sdkUrl ?? defaultSdkUrl;
  let safeSdkUrl = defaultSdkUrl;
  try {
    const parsed = new URL(sdkUrl);
    if (
      parsed.protocol === "https:" &&
      parsed.hostname === "script.supademo.com" &&
      parsed.pathname === "/supademo.js" &&
      parsed.search === "" &&
      parsed.hash === ""
    ) {
      safeSdkUrl = parsed.toString();
    }
  } catch {
    safeSdkUrl = defaultSdkUrl;
  }
  return `<script src="${safeSdkUrl}" defer></script>
<button type="button" onclick="Supademo.open(decodeURIComponent('${demoId}'))">
  Take a tour
</button>`.trim();
}
