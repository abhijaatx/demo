"use client";

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
}>;

export type LocalCaptureBundle = Readonly<{
  version: 1;
  id: string;
  kind: "video" | "screenshots";
  createdAtIso: string;
  title: string;
  mimeType: string;
  blob?: Blob;
  screenshots?: readonly LocalCaptureScreenshot[];
}>;

const DATABASE_NAME = "supademo-local-captures";
const DATABASE_VERSION = 1;
const STORE_NAME = "bundles";
const MAX_ID_LENGTH = 96;
const MAX_SCREENSHOTS = 30;
const MAX_BUNDLE_BYTES = 100 * 1024 * 1024;

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
    (bundle.screenshots || []).reduce((total, screenshot) => total + screenshot.blob.size, 0)
  );
}

function isValidBundle(bundle: LocalCaptureBundle): boolean {
  if (
    bundle.version !== 1 ||
    !normalizeLocalCaptureId(bundle.id) ||
    bundle.title.length > 160 ||
    !/^(?:video\/webm(?:;[^\s]{1,80})?|image\/png)$/u.test(bundle.mimeType)
  )
    return false;
  if (bundle.kind === "video")
    return bundle.blob instanceof Blob && bundleSize(bundle) <= MAX_BUNDLE_BYTES;
  if (bundle.kind !== "screenshots" || !bundle.screenshots?.length) return false;
  if (bundle.screenshots.length > MAX_SCREENSHOTS || bundleSize(bundle) > MAX_BUNDLE_BYTES)
    return false;
  return bundle.screenshots.every(
    (screenshot) =>
      Boolean(normalizeLocalCaptureId(screenshot.id)) &&
      screenshot.blob instanceof Blob &&
      Number.isFinite(screenshot.width) &&
      screenshot.width > 0 &&
      screenshot.width <= 10_000 &&
      Number.isFinite(screenshot.height) &&
      screenshot.height > 0 &&
      screenshot.height <= 10_000 &&
      screenshot.title.length <= 160
  );
}

export async function saveLocalCaptureBundle(bundle: LocalCaptureBundle): Promise<boolean> {
  if (!isValidBundle(bundle)) return false;
  let database: IDBDatabase | null = null;
  try {
    database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database!.transaction(STORE_NAME, "readwrite");
      transaction.onerror = () => reject(transaction.error || new Error("Could not save capture."));
      transaction.oncomplete = () => resolve();
      transaction.objectStore(STORE_NAME).put(bundle);
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
    if (!bundle || typeof bundle !== "object") return null;
    const candidate = bundle as LocalCaptureBundle;
    return isValidBundle(candidate) ? candidate : null;
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

export { MAX_BUNDLE_BYTES, MAX_ID_LENGTH, MAX_SCREENSHOTS };
