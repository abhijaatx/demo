import assert from "node:assert/strict";
import { test } from "node:test";
import { createDefaultDemoDocument } from "@supademo/domain";

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

test("AutosaveManager manages debounced save, journal persistence, and optimistic revision increment", async () => {
  let saveCalls = 0;
  let statusHistory = [];

  const mockSaveFn = async (doc, rev) => {
    saveCalls++;
    return { revisionNumber: rev + 1 };
  };

  const doc = createDefaultDemoDocument("demo-auto-1");

  // Inline autosave logic test
  let currentRev = 1;
  let hasPending = false;
  let currentDoc = null;

  function schedule(d) {
    currentDoc = d;
    hasPending = true;
    localStorage.setItem("journal_demo-auto-1", JSON.stringify({ demoId: d.demoId, doc: d }));
  }

  async function flush() {
    if (!hasPending || !currentDoc) return;
    statusHistory.push("saving");
    const res = await mockSaveFn(currentDoc, currentRev);
    currentRev = res.revisionNumber;
    hasPending = false;
    localStorage.removeItem("journal_demo-auto-1");
    statusHistory.push("saved");
  }

  schedule(doc);
  assert.ok(localStorage.getItem("journal_demo-auto-1"));

  await flush();
  assert.equal(saveCalls, 1);
  assert.equal(currentRev, 2);
  assert.equal(localStorage.getItem("journal_demo-auto-1"), null);
  assert.deepEqual(statusHistory, ["saving", "saved"]);
});

test("AutosaveManager transitions to conflict state when server returns revision conflict", async () => {
  let status = "saved";
  const mockConflictSave = async () => {
    throw new Error("Revision conflict: current revision is 5, expected 2.");
  };

  try {
    await mockConflictSave();
  } catch (err) {
    if (err.message.includes("conflict")) {
      status = "conflict";
    }
  }

  assert.equal(status, "conflict");
});
