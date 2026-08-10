import assert from "node:assert/strict";
import { test } from "node:test";

// Mock localStorage for test environment
if (typeof globalThis.localStorage === "undefined") {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
}

const STORAGE_PREFIX = "supademo_upload_records_";

function saveActiveUploadRecord(record) {
  const key = `${STORAGE_PREFIX}${record.workspaceId}`;
  const existing = getActiveUploadRecords(record.workspaceId);
  const updated = [record, ...existing.filter((r) => r.sessionId !== record.sessionId)];
  localStorage.setItem(key, JSON.stringify(updated.slice(0, 20)));
}

function getActiveUploadRecords(workspaceId) {
  const key = `${STORAGE_PREFIX}${workspaceId}`;
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  return JSON.parse(raw);
}

function clearActiveUploadRecord(workspaceId, sessionId) {
  const key = `${STORAGE_PREFIX}${workspaceId}`;
  const existing = getActiveUploadRecords(workspaceId);
  const updated = existing.filter((r) => r.sessionId !== sessionId);
  localStorage.setItem(key, JSON.stringify(updated));
}

async function pollAssetStatus(workspaceId, assetId, onStatus, options = {}) {
  const { intervalMs = 2000, maxAttempts = 60, fetcher = globalThis.fetch } = options;
  let attempts = 0;
  while (attempts < maxAttempts) {
    attempts++;
    try {
      const response = await fetcher(
        `/api/v1/workspaces/${encodeURIComponent(workspaceId)}/assets/${encodeURIComponent(assetId)}/status`
      );
      if (response.ok) {
        const result = await response.json();
        onStatus(result);
        if (result.isReady || result.isFailed) {
          return result;
        }
      }
    } catch {
      // Reconnect safely
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new Error("Asset processing status poll timed out.");
}

test("upload recovery persists, reads, and clears active upload records", () => {
  const workspaceId = "ws-rec-1";
  const record = {
    sessionId: "sess-123",
    workspaceId,
    fileName: "screen.png",
    mimeType: "image/png",
    totalSizeInBytes: 2048,
    partsTotal: 1,
    completedPartNumbers: [1],
    startedAtIso: new Date().toISOString()
  };

  saveActiveUploadRecord(record);
  const active = getActiveUploadRecords(workspaceId);
  assert.equal(active.length, 1);
  assert.equal(active[0].sessionId, "sess-123");

  clearActiveUploadRecord(workspaceId, "sess-123");
  const cleared = getActiveUploadRecords(workspaceId);
  assert.equal(cleared.length, 0);
});

test("pollAssetStatus polls until status is ready or failed", async () => {
  let callCount = 0;
  const mockFetcher = async () => {
    callCount++;
    const status = callCount < 3 ? "processing" : "ready";
    return {
      ok: true,
      json: async () => ({
        id: "ast-777",
        workspaceId: "ws-rec-1",
        status,
        isReady: status === "ready",
        isFailed: false
      })
    };
  };

  let lastReported = null;
  const finalResult = await pollAssetStatus(
    "ws-rec-1",
    "ast-777",
    (s) => {
      lastReported = s;
    },
    { intervalMs: 1, maxAttempts: 10, fetcher: mockFetcher }
  );

  assert.equal(callCount, 3);
  assert.equal(finalResult.isReady, true);
  assert.equal(lastReported.status, "ready");
});
