import type { components } from "../generated/api.js";

export type UploadSession = components["schemas"]["UploadSession"];
export type UploadPart = components["schemas"]["UploadPart"];
export type InitiateUploadSessionInput = components["schemas"]["InitiateUploadSessionInput"];

export interface UploadSessionClient {
  initiate(
    workspaceId: string,
    input: InitiateUploadSessionInput
  ): Promise<{ session: UploadSession; parts: readonly UploadPart[] }>;

  getPartUrl(workspaceId: string, sessionId: string, partNumber: number): Promise<UploadPart>;

  finalize(
    workspaceId: string,
    sessionId: string,
    checksumSha256?: string
  ): Promise<{ session: UploadSession; assetId: string }>;

  abort(workspaceId: string, sessionId: string): Promise<{ aborted: boolean }>;

  getSession(workspaceId: string, sessionId: string): Promise<UploadSession>;
}

export function createUploadSessionClient(
  fetcher: typeof fetch = globalThis.fetch,
  baseUrl = "/api/v1"
): UploadSessionClient {
  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");

    const response = await fetcher(`${baseUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store"
    });

    if (!response.ok) {
      let message = "Upload session operation failed.";
      try {
        const errorData = (await response.json()) as { error?: { message?: string } };
        if (errorData.error?.message) message = errorData.error.message;
      } catch {
        // use default message
      }
      throw new Error(message);
    }

    return (await response.json()) as T;
  }

  return {
    async initiate(workspaceId, input) {
      return request<{ session: UploadSession; parts: readonly UploadPart[] }>(
        `/workspaces/${encodeURIComponent(workspaceId)}/upload-sessions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": input.idempotencyKey
          },
          body: JSON.stringify(input)
        }
      );
    },

    async getPartUrl(workspaceId, sessionId, partNumber) {
      return request<UploadPart>(
        `/workspaces/${encodeURIComponent(workspaceId)}/upload-sessions/${encodeURIComponent(sessionId)}/parts/${partNumber}/url`
      );
    },

    async finalize(workspaceId, sessionId, checksumSha256) {
      return request<{ session: UploadSession; assetId: string }>(
        `/workspaces/${encodeURIComponent(workspaceId)}/upload-sessions/${encodeURIComponent(sessionId)}/finalize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(checksumSha256 ? { checksumSha256 } : {})
        }
      );
    },

    async abort(workspaceId, sessionId) {
      return request<{ aborted: boolean }>(
        `/workspaces/${encodeURIComponent(workspaceId)}/upload-sessions/${encodeURIComponent(sessionId)}/abort`,
        { method: "POST" }
      );
    },

    async getSession(workspaceId, sessionId) {
      return request<UploadSession>(
        `/workspaces/${encodeURIComponent(workspaceId)}/upload-sessions/${encodeURIComponent(sessionId)}`
      );
    }
  };
}

// ── Upload Recovery & Local Persistence (TASK-049) ─────────────────────────

export type ActiveUploadRecord = Readonly<{
  sessionId: string;
  workspaceId: string;
  fileName: string;
  mimeType: string;
  totalSizeInBytes: number;
  partsTotal: number;
  completedPartNumbers: readonly number[];
  startedAtIso: string;
}>;

const STORAGE_PREFIX = "supademo_upload_records_";

export function saveActiveUploadRecord(record: ActiveUploadRecord): void {
  if (typeof localStorage === "undefined") return;
  try {
    const key = `${STORAGE_PREFIX}${record.workspaceId}`;
    const existing = getActiveUploadRecords(record.workspaceId);
    const updated = [record, ...existing.filter((r) => r.sessionId !== record.sessionId)];
    localStorage.setItem(key, JSON.stringify(updated.slice(0, 20))); // cap at 20 recent
  } catch {
    // LocalStorage failure should never crash upload flow
  }
}

export function getActiveUploadRecords(workspaceId: string): readonly ActiveUploadRecord[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const key = `${STORAGE_PREFIX}${workspaceId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    return JSON.parse(raw) as ActiveUploadRecord[];
  } catch {
    return [];
  }
}

export function clearActiveUploadRecord(workspaceId: string, sessionId: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    const key = `${STORAGE_PREFIX}${workspaceId}`;
    const existing = getActiveUploadRecords(workspaceId);
    const updated = existing.filter((r) => r.sessionId !== sessionId);
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // Ignore
  }
}

export type AssetStatusPollResult = Readonly<{
  id: string;
  workspaceId: string;
  status: string;
  rejectionCode?: string;
  rejectionReason?: string;
  thumbnailPath?: string;
  isReady: boolean;
  isFailed: boolean;
}>;

/**
 * Poll asset processing status until ready or failed (TASK-049)
 */
export async function pollAssetStatus(
  workspaceId: string,
  assetId: string,
  onStatus: (status: AssetStatusPollResult) => void,
  options: { intervalMs?: number; maxAttempts?: number; fetcher?: typeof fetch } = {}
): Promise<AssetStatusPollResult> {
  const { intervalMs = 2000, maxAttempts = 60, fetcher = globalThis.fetch } = options;

  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await fetcher(
        `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/assets/${encodeURIComponent(assetId)}/status`,
        { credentials: "include", cache: "no-store" }
      );
      if (response.ok) {
        const result = (await response.json()) as AssetStatusPollResult;
        onStatus(result);
        if (result.isReady || result.isFailed) {
          return result;
        }
      }
    } catch {
      // Reconnect safely on network error
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Asset processing status poll timed out.");
}
