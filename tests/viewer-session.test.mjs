import assert from "node:assert/strict";
import { test } from "node:test";
import { saveViewerProgress, loadViewerProgress, clearViewerProgress } from "@supademo/player";

if (typeof globalThis.sessionStorage === "undefined") {
  const store = new Map();
  globalThis.sessionStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
}

test("saveViewerProgress and loadViewerProgress persist and resume viewer state", () => {
  saveViewerProgress("demo-view-78", "1.0.0", 3);
  const loaded = loadViewerProgress("demo-view-78", "1.0.0");

  assert.equal(loaded.demoId, "demo-view-78");
  assert.equal(loaded.stepIndex, 3);
});

test("loadViewerProgress invalidates stale sessions on version mismatch and clearViewerProgress removes record", () => {
  saveViewerProgress("demo-view-78", "1.0.0", 5);
  clearViewerProgress("demo-view-78");
  const loaded = loadViewerProgress("demo-view-78", "1.0.0");

  assert.equal(loaded, null);
});
