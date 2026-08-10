"use client";

import type { CropMetadata } from "@supademo/domain";

/**
 * Browser-only handoff storage for recorder output.
 *
 * The media never leaves the current browser. IndexedDB is used instead of
 * localStorage because video blobs can be much larger than the Web Storage
 * quota. Callers still need to offer a download when IndexedDB is unavailable.
 */

export type LocalCaptureScreenshot = Readonly<{
  id: string;
  blob: Blob;
  width: number;
  height: number;
  title: string;
  description?: string;
  atSeconds?: number;
}>;

export type LocalCaptureAsset = Readonly<{
  id: string;
  blob: Blob;
  assetType: "image" | "video" | "document";
  mimeType: string;
  width: number | null;
  height: number | null;
  title: string;
  description?: string;
  crop?: CropMetadata;
  fit?: "cover" | "contain";
}>;

export type LocalCaptureSegment = Readonly<{
  id: string;
  startSeconds: number;
  endSeconds: number;
  speed: number;
  muted: boolean;
}>;

export type LocalCaptureVideoHotspot = Readonly<{
  id: string;
  timeSeconds: number;
  endTimeSeconds: number;
  kind: "pause" | "duration";
  title: string;
  body: string;
}>;

export type LocalCaptureHtmlNode = Readonly<{
  id: string;
  tag: "heading" | "paragraph" | "image" | "button";
  label: string;
  text: string;
  hidden: boolean;
  redacted: boolean;
  imageAssetId?: string;
}>;

export type LocalCaptureBundle = Readonly<{
  version: 1;
  id: string;
  kind: "video" | "screenshots" | "video-split" | "upload" | "html";
  createdAtIso: string;
  title: string;
  mimeType: string;
  blob?: Blob;
  videoDurationSeconds?: number;
  screenshots?: readonly LocalCaptureScreenshot[];
  assets?: readonly LocalCaptureAsset[];
  segments?: readonly LocalCaptureSegment[];
  videoHotspots?: readonly LocalCaptureVideoHotspot[];
  htmlNodes?: readonly LocalCaptureHtmlNode[];
  htmlVariables?: Readonly<Record<string, string>>;
  htmlDisableScroll?: boolean;
}>;

const DATABASE_NAME = "supademo-local-captures";
const DATABASE_VERSION = 1;
const STORE_NAME = "bundles";
const MAX_ID_LENGTH = 96;
const MAX_SCREENSHOTS = 30;
const MAX_UPLOAD_ASSETS = 8;
const MAX_SEGMENTS = 40;
const MAX_VIDEO_HOTSPOTS = 20;
const MAX_HTML_NODES = 60;
const MAX_HTML_VARIABLES = 10;
const MAX_BUNDLE_BYTES = 100 * 1024 * 1024;
const MAX_STORED_BUNDLES = 5;
const MAX_STORED_CAPTURE_BYTES = 200 * 1024 * 1024;
const MAX_BUNDLE_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const BUNDLE_METADATA_ALLOWANCE_BYTES = 256 * 1024;
const STORED_AT_FIELD = "__localCaptureStoredAtMs";
const MAX_DATA_URL_LENGTH = 2_400_000;
const SAFE_MIME_TYPE =
  /^(?:video\/(?:webm|mp4|quicktime)|image\/(?:png|jpeg|webp|gif)|application\/(?:pdf|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation)|text\/html)(?:;[^\s]{1,80})?$/u;

export function normalizeLocalCaptureId(value: string): string {
  return /^[a-zA-Z0-9_-]{1,96}$/u.test(value) ? value : "";
}

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!canUseIndexedDb()) {
      reject(new Error("IndexedDB is unavailable."));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onerror = () => reject(request.error || new Error("Could not open capture storage."));
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function bundleSize(bundle: LocalCaptureBundle): number {
  return (
    (bundle.blob?.size || 0) +
    (bundle.screenshots || []).reduce((total, screenshot) => total + screenshot.blob.size, 0) +
    (bundle.assets || []).reduce((total, asset) => total + asset.blob.size, 0)
  );
}

function estimatedBundleStorageBytes(bundle: LocalCaptureBundle): number {
  return bundleSize(bundle) + BUNDLE_METADATA_ALLOWANCE_BYTES;
}

type StoredLocalCaptureBundle = LocalCaptureBundle &
  Readonly<{
    [STORED_AT_FIELD]?: number;
  }>;

export type LocalCaptureRetentionCandidate = Readonly<{
  storageKey: IDBValidKey;
  id: string;
  storedAtMs: number;
  estimatedBytes: number;
  valid: boolean;
}>;

/**
 * Returns the IndexedDB keys that should be evicted after a save. The bundle
 * currently being saved is protected so a successful handoff never points to
 * an entry removed by its own retention pass.
 */
export function selectLocalCaptureRetentionKeys(
  candidates: readonly LocalCaptureRetentionCandidate[],
  protectedId: string,
  nowMs = Date.now()
): IDBValidKey[] {
  const ordered = candidates
    .map((candidate) => ({
      ...candidate,
      storedAtMs:
        Number.isFinite(candidate.storedAtMs) && candidate.storedAtMs > 0
          ? Math.min(candidate.storedAtMs, nowMs)
          : 0,
      estimatedBytes:
        Number.isFinite(candidate.estimatedBytes) && candidate.estimatedBytes >= 0
          ? candidate.estimatedBytes
          : 0
    }))
    .sort((left, right) => left.storedAtMs - right.storedAtMs || left.id.localeCompare(right.id));
  const deletionKeys = new Set<IDBValidKey>();

  for (const candidate of ordered) {
    if (candidate.id === protectedId) continue;
    if (!candidate.valid || nowMs - candidate.storedAtMs > MAX_BUNDLE_AGE_MS) {
      deletionKeys.add(candidate.storageKey);
    }
  }

  let retainedCount = 0;
  let retainedBytes = 0;
  for (const candidate of ordered) {
    if (deletionKeys.has(candidate.storageKey)) continue;
    retainedCount += 1;
    retainedBytes += candidate.estimatedBytes;
  }

  for (const candidate of ordered) {
    if (retainedCount <= MAX_STORED_BUNDLES && retainedBytes <= MAX_STORED_CAPTURE_BYTES) break;
    if (candidate.id === protectedId || deletionKeys.has(candidate.storageKey)) continue;
    deletionKeys.add(candidate.storageKey);
    retainedCount -= 1;
    retainedBytes -= candidate.estimatedBytes;
  }

  return [...deletionKeys];
}

function withoutStorageMetadata(value: unknown): LocalCaptureBundle | null {
  if (!value || typeof value !== "object") return null;
  const { [STORED_AT_FIELD]: _storedAtMs, ...candidate } = value as StoredLocalCaptureBundle;
  try {
    return isValidBundle(candidate as LocalCaptureBundle)
      ? (candidate as LocalCaptureBundle)
      : null;
  } catch {
    return null;
  }
}

function retentionCandidate(
  storageKey: IDBValidKey,
  value: unknown,
  nowMs: number
): LocalCaptureRetentionCandidate {
  const bundle = withoutStorageMetadata(value);
  const stored = value && typeof value === "object" ? (value as StoredLocalCaptureBundle) : null;
  const storedAtMs = stored?.[STORED_AT_FIELD];
  const createdAtMs = bundle ? Date.parse(bundle.createdAtIso) : Number.NaN;
  return {
    storageKey,
    id: typeof storageKey === "string" ? storageKey : "",
    storedAtMs:
      typeof storedAtMs === "number" && Number.isFinite(storedAtMs) && storedAtMs > 0
        ? Math.min(storedAtMs, nowMs)
        : Number.isFinite(createdAtMs)
          ? Math.min(createdAtMs, nowMs)
          : 0,
    estimatedBytes: bundle ? estimatedBundleStorageBytes(bundle) : 0,
    valid: bundle !== null
  };
}

function scheduleCaptureRetention(
  store: IDBObjectStore,
  storedBundle: StoredLocalCaptureBundle,
  nowMs: number
): void {
  const candidates: LocalCaptureRetentionCandidate[] = [];
  const request = store.openCursor();
  request.onsuccess = () => {
    const cursor = request.result;
    if (cursor) {
      if (cursor.primaryKey !== storedBundle.id) {
        candidates.push(retentionCandidate(cursor.primaryKey, cursor.value, nowMs));
      }
      cursor.continue();
      return;
    }
    candidates.push({
      storageKey: storedBundle.id,
      id: storedBundle.id,
      storedAtMs: nowMs,
      estimatedBytes: estimatedBundleStorageBytes(storedBundle),
      valid: true
    });
    for (const key of selectLocalCaptureRetentionKeys(candidates, storedBundle.id, nowMs)) {
      store.delete(key);
    }
    store.put(storedBundle);
  };
}

function isValidBundle(bundle: LocalCaptureBundle): boolean {
  if (
    bundle.version !== 1 ||
    !normalizeLocalCaptureId(bundle.id) ||
    typeof bundle.createdAtIso !== "string" ||
    bundle.createdAtIso.length > 40 ||
    !Number.isFinite(Date.parse(bundle.createdAtIso)) ||
    typeof bundle.title !== "string" ||
    bundle.title.length > 160 ||
    typeof bundle.mimeType !== "string" ||
    !SAFE_MIME_TYPE.test(bundle.mimeType)
  )
    return false;
  if (bundle.kind === "video") {
    if (!(bundle.blob instanceof Blob) || bundleSize(bundle) > MAX_BUNDLE_BYTES) return false;
    if (
      bundle.videoDurationSeconds !== undefined &&
      (!Number.isFinite(bundle.videoDurationSeconds) ||
        bundle.videoDurationSeconds <= 0 ||
        bundle.videoDurationSeconds > 7_200)
    )
      return false;
    return validateVideoHotspots(bundle.videoHotspots || [], bundle.videoDurationSeconds);
  }
  if (bundle.kind === "video-split") {
    if (!(bundle.blob instanceof Blob)) return false;
    if (
      (bundle.screenshots || []).length > MAX_SCREENSHOTS ||
      bundleSize(bundle) > MAX_BUNDLE_BYTES
    )
      return false;
    if (bundle.segments && bundle.segments.length > MAX_SEGMENTS) return false;
    if (
      bundle.segments?.some(
        (segment) =>
          !normalizeLocalCaptureId(segment.id) ||
          !Number.isFinite(segment.startSeconds) ||
          !Number.isFinite(segment.endSeconds) ||
          segment.startSeconds < 0 ||
          segment.endSeconds <= segment.startSeconds ||
          segment.endSeconds > 7_200 ||
          !Number.isFinite(segment.speed) ||
          segment.speed < 0.25 ||
          segment.speed > 4
      )
    )
      return false;
    return validateScreenshots(bundle.screenshots || []);
  }
  if (bundle.kind === "screenshots") {
    if (!bundle.screenshots?.length) return false;
    if (bundle.screenshots.length > MAX_SCREENSHOTS || bundleSize(bundle) > MAX_BUNDLE_BYTES)
      return false;
    return validateScreenshots(bundle.screenshots);
  }
  if (bundle.kind === "html") {
    if (!bundle.htmlNodes?.length || bundle.htmlNodes.length > MAX_HTML_NODES) return false;
    if (
      (bundle.assets && bundle.assets.length > MAX_UPLOAD_ASSETS) ||
      bundleSize(bundle) > MAX_BUNDLE_BYTES
    )
      return false;
    if (bundle.assets && !validateAssets(bundle.assets)) return false;
    if (bundle.htmlVariables && !validateHtmlVariables(bundle.htmlVariables)) return false;
    return bundle.htmlNodes.every(
      (node) =>
        Boolean(normalizeLocalCaptureId(node.id)) &&
        ["heading", "paragraph", "image", "button"].includes(node.tag) &&
        node.label.length <= 160 &&
        node.text.length <= 400 &&
        typeof node.hidden === "boolean" &&
        typeof node.redacted === "boolean" &&
        (node.imageAssetId === undefined || Boolean(normalizeLocalCaptureId(node.imageAssetId)))
    );
  }
  if (bundle.kind !== "upload" || !bundle.assets?.length) return false;
  if (bundle.assets.length > MAX_UPLOAD_ASSETS || bundleSize(bundle) > MAX_BUNDLE_BYTES)
    return false;
  return validateAssets(bundle.assets);
}

function validateAssets(assets: readonly LocalCaptureAsset[]): boolean {
  return assets.every(
    (asset) =>
      Boolean(normalizeLocalCaptureId(asset.id)) &&
      asset.blob instanceof Blob &&
      ["image", "video", "document"].includes(asset.assetType) &&
      SAFE_MIME_TYPE.test(asset.mimeType) &&
      (asset.width === null ||
        (Number.isFinite(asset.width) && asset.width > 0 && asset.width <= 10_000)) &&
      (asset.height === null ||
        (Number.isFinite(asset.height) && asset.height > 0 && asset.height <= 10_000)) &&
      asset.title.length <= 160 &&
      (asset.description === undefined || asset.description.length <= 400) &&
      (asset.fit === undefined || asset.fit === "cover" || asset.fit === "contain") &&
      (asset.crop === undefined || isValidCrop(asset.crop))
  );
}

function isValidCrop(crop: CropMetadata): boolean {
  return (
    Number.isFinite(crop.x) &&
    Number.isFinite(crop.y) &&
    Number.isFinite(crop.width) &&
    Number.isFinite(crop.height) &&
    crop.x >= 0 &&
    crop.y >= 0 &&
    crop.width > 0 &&
    crop.height > 0 &&
    crop.x + crop.width <= 100 &&
    crop.y + crop.height <= 100
  );
}

function validateVideoHotspots(
  hotspots: readonly LocalCaptureVideoHotspot[],
  durationSeconds?: number
): boolean {
  if (hotspots.length > MAX_VIDEO_HOTSPOTS) return false;
  return hotspots.every(
    (hotspot) =>
      Boolean(normalizeLocalCaptureId(hotspot.id)) &&
      (hotspot.kind === "pause" || hotspot.kind === "duration") &&
      Number.isFinite(hotspot.timeSeconds) &&
      Number.isFinite(hotspot.endTimeSeconds) &&
      hotspot.timeSeconds >= 0 &&
      (hotspot.kind === "pause"
        ? hotspot.endTimeSeconds >= hotspot.timeSeconds
        : hotspot.endTimeSeconds > hotspot.timeSeconds) &&
      hotspot.endTimeSeconds <= 7_200 &&
      (durationSeconds === undefined || hotspot.endTimeSeconds <= durationSeconds) &&
      hotspot.title.length <= 120 &&
      hotspot.body.length <= 400
  );
}

function validateHtmlVariables(variables: Readonly<Record<string, string>>): boolean {
  const entries = Object.entries(variables);
  return (
    entries.length <= MAX_HTML_VARIABLES &&
    entries.every(
      ([key, value]) =>
        /^[A-Za-z][A-Za-z0-9_-]{0,39}$/u.test(key) &&
        typeof value === "string" &&
        value.length <= 160
    )
  );
}

function validateScreenshots(screenshots: readonly LocalCaptureScreenshot[]): boolean {
  return screenshots.every(
    (screenshot) =>
      Boolean(normalizeLocalCaptureId(screenshot.id)) &&
      screenshot.blob instanceof Blob &&
      Number.isFinite(screenshot.width) &&
      screenshot.width > 0 &&
      screenshot.width <= 10_000 &&
      Number.isFinite(screenshot.height) &&
      screenshot.height > 0 &&
      screenshot.height <= 10_000 &&
      screenshot.title.length <= 160 &&
      (screenshot.description === undefined || screenshot.description.length <= 400) &&
      (screenshot.atSeconds === undefined ||
        (Number.isFinite(screenshot.atSeconds) &&
          screenshot.atSeconds >= 0 &&
          screenshot.atSeconds <= 7_200))
  );
}

export async function saveLocalCaptureBundle(bundle: LocalCaptureBundle): Promise<boolean> {
  if (!isValidBundle(bundle)) return false;
  let database: IDBDatabase | null = null;
  try {
    database = await openDatabase();
    const storedAtMs = Date.now();
    const storedBundle: StoredLocalCaptureBundle = {
      ...bundle,
      [STORED_AT_FIELD]: storedAtMs
    };
    await new Promise<void>((resolve, reject) => {
      const transaction = database!.transaction(STORE_NAME, "readwrite");
      transaction.onerror = () => reject(transaction.error || new Error("Could not save capture."));
      transaction.oncomplete = () => resolve();
      const store = transaction.objectStore(STORE_NAME);
      scheduleCaptureRetention(store, storedBundle, storedAtMs);
    });
    return true;
  } catch {
    return false;
  } finally {
    database?.close();
  }
}

export async function readLocalCaptureBundle(id: string): Promise<LocalCaptureBundle | null> {
  const normalizedId = normalizeLocalCaptureId(id);
  if (!normalizedId) return null;
  let database: IDBDatabase | null = null;
  try {
    database = await openDatabase();
    const bundle = await new Promise<unknown>((resolve, reject) => {
      const request = database!
        .transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .get(normalizedId);
      request.onerror = () => reject(request.error || new Error("Could not read capture."));
      request.onsuccess = () => resolve(request.result);
    });
    return withoutStorageMetadata(bundle);
  } catch {
    return null;
  } finally {
    database?.close();
  }
}

export async function deleteLocalCaptureBundle(id: string): Promise<void> {
  const normalizedId = normalizeLocalCaptureId(id);
  if (!normalizedId) return;
  let database: IDBDatabase | null = null;
  try {
    database = await openDatabase();
    await new Promise<void>((resolve) => {
      const transaction = database!.transaction(STORE_NAME, "readwrite");
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
      transaction.objectStore(STORE_NAME).delete(normalizedId);
    });
  } catch {
    // Best-effort cleanup; a failed cleanup never blocks the local editor.
  } finally {
    database?.close();
  }
}

export function dataUrlToBlob(value: string): Blob | null {
  if (value.length > MAX_DATA_URL_LENGTH) return null;
  const match = /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+=*)$/u.exec(value);
  if (!match || typeof atob !== "function") return null;
  try {
    const decoded = atob(match[2]);
    const bytes = new Uint8Array(decoded.length);
    for (let index = 0; index < decoded.length; index += 1)
      bytes[index] = decoded.charCodeAt(index);
    return new Blob([bytes], { type: match[1] });
  } catch {
    return null;
  }
}

export {
  MAX_BUNDLE_AGE_MS,
  MAX_BUNDLE_BYTES,
  MAX_HTML_NODES,
  MAX_ID_LENGTH,
  MAX_SCREENSHOTS,
  MAX_STORED_BUNDLES,
  MAX_STORED_CAPTURE_BYTES,
  MAX_VIDEO_HOTSPOTS
};
