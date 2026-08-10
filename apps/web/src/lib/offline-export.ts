import { createStoredZip, parseDemoDocument, type DemoDocument } from "@supademo/domain";

export interface OfflineDownloadRecord {
  readonly demoId: string;
  readonly title: string;
  readonly downloadedAtIso: string;
  readonly document: DemoDocument;
}

const DOWNLOADS_KEY = "supademo_offline_downloads";
const MAX_DOWNLOADS = 25;
const MAX_DOCUMENT_BYTES = 5_000_000;

function boundedDemoId(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/gu, "-").slice(0, 120) || "offline-demo";
}

function parseRecord(value: unknown): OfflineDownloadRecord | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.demoId !== "string" || typeof candidate.title !== "string") return null;
  try {
    return Object.freeze({
      demoId: boundedDemoId(candidate.demoId),
      title: candidate.title.trim().slice(0, 160) || "Offline demo",
      downloadedAtIso:
        typeof candidate.downloadedAtIso === "string"
          ? candidate.downloadedAtIso
          : new Date(0).toISOString(),
      document: parseDemoDocument(candidate.document)
    });
  } catch {
    return null;
  }
}

export function readOfflineDownloads(): readonly OfflineDownloadRecord[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(DOWNLOADS_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.slice(-MAX_DOWNLOADS).flatMap((entry) => {
      const record = parseRecord(entry);
      return record ? [record] : [];
    });
  } catch {
    return [];
  }
}

export function saveOfflineDownload(
  demoId: string,
  document: DemoDocument
): OfflineDownloadRecord | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const parsedDocument = parseDemoDocument(document);
    const record: OfflineDownloadRecord = Object.freeze({
      demoId: boundedDemoId(demoId),
      title: boundedDemoId(demoId),
      downloadedAtIso: new Date().toISOString(),
      document: parsedDocument
    });
    const encoded = JSON.stringify(record);
    if (encoded.length > MAX_DOCUMENT_BYTES) return null;
    const next = [
      ...readOfflineDownloads().filter((entry) => entry.demoId !== record.demoId),
      record
    ].slice(-MAX_DOWNLOADS);
    localStorage.setItem(`supademo_offline_${record.demoId}`, encoded);
    localStorage.setItem(DOWNLOADS_KEY, JSON.stringify(next));
    return record;
  } catch {
    return null;
  }
}

export function removeOfflineDownload(demoId: string): void {
  if (typeof localStorage === "undefined") return;
  const safeId = boundedDemoId(demoId);
  try {
    localStorage.removeItem(`supademo_offline_${safeId}`);
    localStorage.setItem(
      DOWNLOADS_KEY,
      JSON.stringify(readOfflineDownloads().filter((entry) => entry.demoId !== safeId))
    );
  } catch {
    // Offline cleanup is best effort and never blocks the player.
  }
}

const OFFLINE_PLAYER_SCRIPT = String.raw`(() => {
  "use strict";
  const root = document.getElementById("offline-root");
  const status = document.getElementById("offline-status");
  const steps = document.getElementById("offline-steps");
  const imageUrl = (value) => {
    try {
      const parsed = new URL(value);
      return parsed.protocol === "https:" ? parsed.toString() : null;
    } catch { return null; }
  };
  const render = (doc) => {
    if (!root || !steps) return;
    const title = document.createElement("h1");
    title.textContent = typeof doc.title === "string" ? doc.title : "Offline demo";
    root.prepend(title);
    const items = Array.isArray(doc.steps) ? doc.steps.slice(0, 100) : [];
    items.forEach((step, index) => {
      const card = document.createElement("article");
      const heading = document.createElement("h2");
      heading.textContent = (index + 1) + ". " + (typeof step.title === "string" ? step.title : "Step");
      card.append(heading);
      if (typeof step.description === "string" && step.description.trim()) {
        const copy = document.createElement("p");
        copy.textContent = step.description.slice(0, 4000);
        card.append(copy);
      }
      const media = step.media && typeof step.media.storagePath === "string" ? imageUrl(step.media.storagePath) : null;
      if (media) {
        const image = document.createElement("img");
        image.src = media;
        image.alt = "Step " + (index + 1) + " screenshot";
        image.loading = "lazy";
        card.append(image);
      }
      steps.append(card);
    });
    if (status) status.textContent = items.length + " steps available offline.";
  };
  fetch("demo.json", { credentials: "omit" }).then((response) => {
    if (!response.ok) throw new Error("Could not read demo package.");
    return response.json();
  }).then(render).catch((error) => {
    if (status) status.textContent = error instanceof Error ? error.message : "Offline package unavailable.";
  });
})();`;

export function createOfflineZip(demoId: string, document: DemoDocument): Uint8Array {
  const parsedDocument = parseDemoDocument(document);
  const documentJson = JSON.stringify(parsedDocument).replace(/</gu, "\\u003c");
  if (documentJson.length > MAX_DOCUMENT_BYTES)
    throw new Error("This demo is too large for an offline download.");
  return createStoredZip({
    "index.html": `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Offline Supademo</title><link rel="stylesheet" href="styles.css"></head><body><main id="offline-root"><p id="offline-status" role="status">Loading offline demo…</p><section id="offline-steps"></section></main><script src="offline-player.js"></script></body></html>`,
    "demo.json": documentJson,
    "offline-player.js": OFFLINE_PLAYER_SCRIPT,
    "styles.css": `:root{color-scheme:light}*{box-sizing:border-box}body{margin:0;background:#f7f9fc;color:#172033;font:16px/1.5 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}main{width:min(100% - 32px,1000px);margin:32px auto;padding:24px;background:#fff;border:1px solid #dfe4ec;border-radius:16px;box-shadow:0 12px 36px #17203314}h1{margin:0 0 8px;font-size:clamp(24px,4vw,38px);letter-spacing:-.04em}#offline-status{color:#667085}#offline-steps{display:grid;gap:16px;margin-top:24px}article{padding:16px;border:1px solid #e2e7ef;border-radius:12px}h2{margin:0 0 8px;font-size:18px}p{color:#58657b}img{display:block;max-width:100%;max-height:560px;margin-top:12px;border:1px solid #e2e7ef;border-radius:8px;object-fit:contain}`
  });
}

export { DOWNLOADS_KEY };
