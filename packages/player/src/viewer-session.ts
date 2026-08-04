/**
 * Anonymous Viewer Progress & Resume Session Storage — TASK-078
 */

export interface ViewerSessionRecord {
  readonly demoId: string;
  readonly version: string;
  readonly stepIndex: number;
  readonly updatedAtIso: string;
}

const STORAGE_PREFIX = "supademo_viewer_session_";
const MAX_SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function saveViewerProgress(demoId: string, version: string, stepIndex: number): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const record: ViewerSessionRecord = {
      demoId,
      version,
      stepIndex,
      updatedAtIso: new Date().toISOString()
    };
    sessionStorage.setItem(`${STORAGE_PREFIX}${demoId}`, JSON.stringify(record));
  } catch {
    // Ignore storage errors on restricted browsers
  }
}

export function loadViewerProgress(
  demoId: string,
  expectedVersion: string
): ViewerSessionRecord | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`${STORAGE_PREFIX}${demoId}`);
    if (!raw) return null;

    const record: ViewerSessionRecord = JSON.parse(raw);
    if (record.version !== expectedVersion) {
      // Invalidate stale session from prior version
      clearViewerProgress(demoId);
      return null;
    }

    const age = Date.now() - new Date(record.updatedAtIso).getTime();
    if (age > MAX_SESSION_AGE_MS) {
      clearViewerProgress(demoId);
      return null;
    }

    return record;
  } catch {
    return null;
  }
}

export function clearViewerProgress(demoId: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(`${STORAGE_PREFIX}${demoId}`);
  } catch {
    // Ignore
  }
}
