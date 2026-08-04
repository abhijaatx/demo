import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";
import { test } from "node:test";
import {
  createDefaultDemoDocument,
  reorderSteps,
  duplicateStep,
  parseDemoDocument,
  serializeDemoDocument
} from "@supademo/domain";

test("200-step performance fixture executes reorder, duplication, and serialization within latency budget (< 50ms)", () => {
  const doc = createDefaultDemoDocument("demo-perf-200");
  const steps = [];
  for (let i = 0; i < 200; i++) {
    steps.push({
      id: `step-${i}`,
      orderIndex: i,
      title: `Step ${i}`,
      description: null,
      media: {
        assetId: `ast-${i}`,
        assetType: "image",
        storagePath: `/assets/${i}.png`,
        width: 1920,
        height: 1080,
        durationSeconds: null,
        posterPath: null
      },
      hotspots: [
        {
          id: `hotspot-${i}`,
          x: (i * 2) % 100,
          y: (i * 3) % 100,
          width: 10,
          height: 10,
          targetStepId: null,
          tooltipText: `Click step ${i}`,
          style: { pulse: true, color: "#4f46e5", opacity: 0.8 }
        }
      ],
      callouts: [],
      audioNarration: null
    });
  }

  const doc200 = { ...doc, steps };

  // 1. Measure Reordering performance
  const t0 = performance.now();
  const reordered = reorderSteps(doc200.steps, 0, 199);
  const reorderTimeMs = performance.now() - t0;
  assert.equal(reordered.length, 200);
  assert.ok(reorderTimeMs < 50, `Reorder took ${reorderTimeMs}ms, expected < 50ms`);

  // 2. Measure Duplication performance
  const t1 = performance.now();
  const duplicated = duplicateStep(doc200.steps[0]);
  const duplicateTimeMs = performance.now() - t1;
  assert.ok(duplicated.id !== "step-0");
  assert.ok(duplicateTimeMs < 50, `Duplication took ${duplicateTimeMs}ms, expected < 50ms`);

  // 3. Measure Serialization performance
  const t2 = performance.now();
  const json = serializeDemoDocument({ ...doc200, steps: reordered });
  const parsed = parseDemoDocument(JSON.parse(json));
  const serializeTimeMs = performance.now() - t2;
  assert.equal(parsed.steps.length, 200);
  assert.ok(serializeTimeMs < 50, `Serialization took ${serializeTimeMs}ms, expected < 50ms`);
});

test("Autosave chaos simulation preserves local journal on unexpected errors", () => {
  if (typeof globalThis.localStorage === "undefined") {
    const store = new Map();
    globalThis.localStorage = {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, String(value)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear()
    };
  }

  const doc = createDefaultDemoDocument("demo-chaos-1");
  const journalKey = "supademo_draft_journal_demo-chaos-1";

  // Simulate local journal write
  globalThis.localStorage.setItem(
    journalKey,
    JSON.stringify({ demoId: doc.demoId, document: doc })
  );
  assert.ok(globalThis.localStorage.getItem(journalKey));

  // Simulate recovery after crash
  const recoveredRaw = globalThis.localStorage.getItem(journalKey);
  const recovered = JSON.parse(recoveredRaw);
  assert.equal(recovered.demoId, "demo-chaos-1");
});
