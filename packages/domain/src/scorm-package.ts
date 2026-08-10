/**
 * Browser-only SCORM 1.2 wrapper package primitives.
 *
 * The generated package keeps the learner content hosted at its original HTTPS
 * URL and contains only a launch shell plus the SCORM runtime. No source HTML
 * is fetched or persisted by this module.
 */

export type ScormCompletionRule = "supademo-finish" | "active-time" | "manual" | "launched";

export interface ScormPackageConfig {
  readonly sourceUrl: string;
  readonly courseTitle: string;
  readonly courseIdentifier: string;
  readonly aspectRatio: number;
  readonly minHeight: number;
  readonly completionRule: ScormCompletionRule;
  readonly activeViewingSeconds: number;
  readonly showManualFallback: boolean;
}

export interface NormalizedScormSource {
  readonly sourceUrl: string;
  readonly sourceKind: "url" | "iframe";
}

export interface ScormPackageFiles extends Readonly<Record<string, string>> {
  readonly "imsmanifest.xml": string;
  readonly "index.html": string;
  readonly "scorm-wrapper.js": string;
  readonly "styles.css": string;
}

const MAX_SOURCE_LENGTH = 20_000;
const MAX_TITLE_LENGTH = 160;
const MAX_IDENTIFIER_LENGTH = 120;
const MIN_ASPECT_RATIO = 0.5;
const MAX_ASPECT_RATIO = 4;
const MIN_HEIGHT = 160;
const MAX_HEIGHT = 4_000;

function boundedText(value: string, fallback: string, maxLength: number): string {
  const normalized = Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      return !(
        (code >= 0 && code <= 8) ||
        code === 11 ||
        code === 12 ||
        (code >= 14 && code <= 31) ||
        code === 127
      );
    })
    .join("")
    .trim()
    .slice(0, maxLength);
  return normalized || fallback;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>'"]/gu, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "'":
        return "&apos;";
      default:
        return "&quot;";
    }
  });
}

function escapeHtmlAttribute(value: string): string {
  return value.replace(/[&<>'"]/gu, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "'":
        return "&#39;";
      default:
        return "&quot;";
    }
  });
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replaceAll("[", "").replaceAll("]", "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host === "0.0.0.0" ||
    host === "::1"
  ) {
    return true;
  }
  const octets = host.split(".").map((part) => Number(part));
  if (
    octets.length === 4 &&
    octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
  ) {
    const [first, second] = octets;
    return (
      first === 10 ||
      first === 127 ||
      (first === 169 && second === 254) ||
      (first === 172 && second !== undefined && second >= 16 && second <= 31) ||
      (first === 192 && second === 168)
    );
  }
  return host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:");
}

function secureHttpsUrl(value: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Enter a valid HTTPS URL or iframe embed.");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username ||
    parsed.password ||
    isPrivateHost(parsed.hostname)
  ) {
    throw new Error("Only public HTTPS URLs are supported.");
  }
  parsed.hash = "";
  return parsed;
}

function extractIframeSource(value: string): string | null {
  const match = /<iframe\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/iu.exec(value);
  return match?.[1]?.trim() ?? null;
}

/** Normalize a URL or iframe/div embed into one safe HTTPS launch URL. */
export function normalizeScormSource(value: string): NormalizedScormSource {
  const source = value.trim().slice(0, MAX_SOURCE_LENGTH);
  if (!source) throw new Error("Paste a URL or iframe embed code first.");
  const iframeSource = extractIframeSource(source);
  const candidate = iframeSource ?? source;
  const parsed = secureHttpsUrl(candidate);
  if (
    (parsed.hostname === "app.supademo.com" || parsed.hostname === "supademo.com") &&
    parsed.pathname.startsWith("/demo/")
  ) {
    parsed.pathname = `/embed/${parsed.pathname.slice("/demo/".length)}`;
  }
  return { sourceUrl: parsed.toString(), sourceKind: iframeSource ? "iframe" : "url" };
}

function normalizedConfig(config: ScormPackageConfig): ScormPackageConfig {
  const source = normalizeScormSource(config.sourceUrl);
  const courseTitle = boundedText(config.courseTitle, "Interactive Demo", MAX_TITLE_LENGTH);
  const courseIdentifier = boundedText(
    config.courseIdentifier,
    "interactive-demo-course",
    MAX_IDENTIFIER_LENGTH
  ).replace(/[^a-zA-Z0-9._-]/gu, "-");
  return {
    sourceUrl: source.sourceUrl,
    courseTitle,
    courseIdentifier: courseIdentifier || "interactive-demo-course",
    aspectRatio: Math.min(
      MAX_ASPECT_RATIO,
      Math.max(MIN_ASPECT_RATIO, Number(config.aspectRatio) || 1.76)
    ),
    minHeight: Math.min(
      MAX_HEIGHT,
      Math.max(MIN_HEIGHT, Math.floor(Number(config.minHeight) || 480))
    ),
    completionRule: config.completionRule,
    activeViewingSeconds: Math.min(
      3_600,
      Math.max(5, Math.floor(Number(config.activeViewingSeconds) || 30))
    ),
    showManualFallback: config.showManualFallback
  };
}

function runtimeConfig(config: ScormPackageConfig): string {
  return JSON.stringify({
    sourceUrl: config.sourceUrl,
    completionRule: config.completionRule,
    activeViewingSeconds: config.activeViewingSeconds,
    showManualFallback: config.showManualFallback
  });
}

function completionLabel(rule: ScormCompletionRule): string {
  switch (rule) {
    case "active-time":
      return "active viewing time";
    case "manual":
      return "learner confirmation";
    case "launched":
      return "module launch";
    default:
      return "Supademo completion";
  }
}

export function buildScormFiles(input: ScormPackageConfig): ScormPackageFiles {
  const config = normalizedConfig(input);
  const title = escapeXml(config.courseTitle);
  const identifier = escapeXml(config.courseIdentifier);
  const sourceUrl = escapeHtmlAttribute(config.sourceUrl);
  const configJson = runtimeConfig(config).replace(/</gu, "\\u003c");
  const manualButton = config.showManualFallback
    ? '<button id="mark-complete" type="button">Mark complete</button>'
    : "";
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="${identifier}" version="1.0" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 http://www.imsglobal.org/xsd/imscp_rootv1p1p2.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 http://www.imsglobal.org/xsd/adlcp_rootv1p2.xsd">
  <organizations default="organization-1">
    <organization identifier="organization-1">
      <title>${title}</title>
      <item identifier="item-1" identifierref="resource-1"><title>${title}</title></item>
    </organization>
  </organizations>
  <resources><resource identifier="resource-1" type="webcontent" adlcp:scormtype="sco" href="index.html"><file href="index.html"/><file href="scorm-wrapper.js"/><file href="styles.css"/></resource></resources>
</manifest>`;
  const index = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtmlAttribute(config.courseTitle)}</title><link rel="stylesheet" href="styles.css"></head>
<body><main class="scorm-shell"><header><h1>${escapeHtmlAttribute(config.courseTitle)}</h1><p>Interactive learning module · Completion tracked by ${completionLabel(config.completionRule)}.</p></header><section class="scorm-stage"><iframe id="supademo-content" title="${escapeHtmlAttribute(config.courseTitle)}" src="${sourceUrl}" sandbox="allow-scripts allow-forms allow-popups" referrerpolicy="no-referrer" loading="eager"></iframe></section>${manualButton}<p id="scorm-status" role="status" aria-live="polite">Loading module…</p></main><script>window.__SUPADEMO_SCORM_CONFIG__=${configJson};</script><script src="scorm-wrapper.js"></script></body></html>`;
  const runtime = `(() => {
  "use strict";
  const config = window.__SUPADEMO_SCORM_CONFIG__ || {};
  const iframe = document.getElementById("supademo-content");
  const status = document.getElementById("scorm-status");
  const manualButton = document.getElementById("mark-complete");
  const startedAt = Date.now();
  let completed = false;
  let initialized = false;
  let activeSeconds = 0;
  let visible = true;
  let foreground = document.visibilityState === "visible";
  const sourceOrigin = (() => { try { return new URL(config.sourceUrl).origin; } catch { return ""; } })();
  function findApi() {
    let current = window;
    for (let depth = 0; depth < 8 && current; depth += 1) {
      if (current.API) return current.API;
      if (current.parent === current) break;
      current = current.parent;
    }
    return null;
  }
  function call(name, ...args) { const api = findApi(); try { return api && typeof api[name] === "function" ? api[name](...args) : null; } catch { return null; } }
  function setStatus(message) { if (status) status.textContent = message; }
  function initialize() { if (initialized) return; initialized = true; call("LMSInitialize", ""); call("LMSSetValue", "cmi.core.lesson_status", "incomplete"); call("LMSCommit", ""); setStatus("Module ready."); }
  function sessionTime() { const seconds = Math.max(0, Math.floor((Date.now() - startedAt) / 1000)); const h = String(Math.floor(seconds / 3600)).padStart(2, "0"); const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0"); const s = String(seconds % 60).padStart(2, "0"); return h + ":" + m + ":" + s; }
  function complete(reason) { if (completed) return; completed = true; initialize(); call("LMSSetValue", "cmi.core.lesson_status", "completed"); call("LMSSetValue", "cmi.core.score.raw", "100"); call("LMSSetValue", "cmi.core.score.min", "0"); call("LMSSetValue", "cmi.core.score.max", "100"); call("LMSSetValue", "cmi.core.session_time", sessionTime()); call("LMSCommit", ""); setStatus("Complete — " + reason + "."); }
  function progress(value) { initialize(); const percentage = Math.min(100, Math.max(0, Number(value) || 0)); call("LMSSetValue", "cmi.core.score.raw", String(Math.round(percentage))); call("LMSSetValue", "cmi.core.score.min", "0"); call("LMSSetValue", "cmi.core.score.max", "100"); call("LMSCommit", ""); }
  window.addEventListener("message", (event) => { if (!iframe || event.source !== iframe.contentWindow || event.origin !== sourceOrigin) return; const data = event.data; if (!data || data.source !== "Supademo" || typeof data.type !== "string") return; if (data.type === "Supademo:load") initialize(); if (data.type === "Supademo:progress") progress(data.percentage); if (data.type === "Supademo:completed" && config.completionRule === "supademo-finish") complete("Supademo finished"); });
  document.addEventListener("visibilitychange", () => { foreground = document.visibilityState === "visible"; });
  if (manualButton) manualButton.addEventListener("click", () => complete("learner confirmation"));
  if ("IntersectionObserver" in window && iframe) new IntersectionObserver((entries) => { visible = entries[0]?.isIntersecting ?? true; }, { threshold: 0.5 }).observe(iframe);
  if (config.completionRule === "launched") complete("module launched");
  window.setInterval(() => { if (!completed && config.completionRule === "active-time" && visible && foreground) { activeSeconds += 1; if (activeSeconds >= Number(config.activeViewingSeconds || 30)) complete("active viewing time reached"); } }, 1000);
  window.addEventListener("beforeunload", () => { call("LMSSetValue", "cmi.core.session_time", sessionTime()); call("LMSCommit", ""); call("LMSFinish", ""); });
})();`;
  const styles = `:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f5f7fb;color:#172033;font:16px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.scorm-shell{width:min(100% - 32px,1200px);margin:24px auto;padding:24px;background:#fff;border:1px solid #d9dfeb;border-radius:16px;box-shadow:0 12px 36px #17203314}.scorm-shell h1{margin:0;font-size:clamp(22px,3vw,34px);letter-spacing:-.03em}.scorm-shell header p{margin:6px 0 20px;color:#58657b}.scorm-stage{width:100%;aspect-ratio:${config.aspectRatio};min-height:${config.minHeight}px;background:#eef2f8;border:1px solid #d9dfeb;border-radius:12px;overflow:hidden}.scorm-stage iframe{display:block;width:100%;height:100%;min-height:${config.minHeight}px;border:0}#mark-complete{margin-top:16px;padding:11px 18px;border:0;border-radius:8px;background:#4c46e5;color:#fff;font:600 15px system-ui;cursor:pointer}#scorm-status{margin:14px 0 0;color:#58657b;font-size:14px}`;
  return {
    "imsmanifest.xml": manifest,
    "index.html": index,
    "scorm-wrapper.js": runtime,
    "styles.css": styles
  };
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function writeU16(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
}

function writeU32(target: Uint8Array, offset: number, value: number): void {
  target[offset] = value & 0xff;
  target[offset + 1] = (value >>> 8) & 0xff;
  target[offset + 2] = (value >>> 16) & 0xff;
  target[offset + 3] = (value >>> 24) & 0xff;
}

const MAX_ZIP_FILES = 64;
const MAX_ZIP_FILENAME_BYTES = 160;
const MAX_ZIP_ENTRY_BYTES = 10_000_000;
const MAX_ZIP_TOTAL_BYTES = 20_000_000;

function safeZipFilename(name: string, encoder: TextEncoder): Uint8Array {
  const containsControl = Array.from(name).some((character) => {
    const code = character.charCodeAt(0);
    return (code >= 0 && code <= 31) || code === 127;
  });
  if (
    !name ||
    name.startsWith("/") ||
    name.includes("\\") ||
    containsControl ||
    name.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error("ZIP filenames must be relative and normalized.");
  }
  const encoded = encoder.encode(name);
  if (encoded.length > MAX_ZIP_FILENAME_BYTES) throw new Error("ZIP filename is too long.");
  return encoded;
}

/** Create a standards-compatible, stored (uncompressed) ZIP without a dependency. */
export function createStoredZip(files: Readonly<Record<string, string>>): Uint8Array {
  const encoder = new TextEncoder();
  const rawEntries = Object.entries(files);
  if (rawEntries.length === 0 || rawEntries.length > MAX_ZIP_FILES)
    throw new Error("ZIP file count is outside the supported bounds.");
  const names = new Set<string>();
  let totalBytes = 0;
  const entries = rawEntries.map(([name, content]) => {
    if (names.has(name)) throw new Error("ZIP filenames must be unique.");
    names.add(name);
    const data = encoder.encode(content);
    if (data.length > MAX_ZIP_ENTRY_BYTES) throw new Error("ZIP entry is too large.");
    totalBytes += data.length;
    if (totalBytes > MAX_ZIP_TOTAL_BYTES) throw new Error("ZIP package is too large.");
    return { name: safeZipFilename(name, encoder), data };
  });
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  for (const entry of entries) {
    const header = new Uint8Array(30 + entry.name.length);
    writeU32(header, 0, 0x04034b50);
    writeU16(header, 4, 20);
    writeU16(header, 8, 0);
    writeU32(header, 14, crc32(entry.data));
    writeU32(header, 18, entry.data.length);
    writeU32(header, 22, entry.data.length);
    writeU16(header, 26, entry.name.length);
    header.set(entry.name, 30);
    localParts.push(header, entry.data);

    const central = new Uint8Array(46 + entry.name.length);
    writeU32(central, 0, 0x02014b50);
    writeU16(central, 4, 20);
    writeU16(central, 6, 20);
    writeU16(central, 8, 0);
    writeU32(central, 16, crc32(entry.data));
    writeU32(central, 20, entry.data.length);
    writeU32(central, 24, entry.data.length);
    writeU16(central, 28, entry.name.length);
    writeU32(central, 42, offset);
    central.set(entry.name, 46);
    centralParts.push(central);
    offset += header.length + entry.data.length;
  }
  const centralSize = centralParts.reduce((total, part) => total + part.length, 0);
  const end = new Uint8Array(22);
  writeU32(end, 0, 0x06054b50);
  writeU16(end, 8, entries.length);
  writeU16(end, 10, entries.length);
  writeU32(end, 12, centralSize);
  writeU32(end, 16, offset);
  const output = new Uint8Array(offset + centralSize + end.length);
  let cursor = 0;
  for (const part of localParts) {
    output.set(part, cursor);
    cursor += part.length;
  }
  for (const part of centralParts) {
    output.set(part, cursor);
    cursor += part.length;
  }
  output.set(end, cursor);
  return output;
}

export { MAX_SOURCE_LENGTH };
