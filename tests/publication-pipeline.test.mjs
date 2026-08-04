import assert from "node:assert/strict";
import { test } from "node:test";
import { createDefaultDemoDocument, publishDemoDocument, unpublishDemo } from "@supademo/domain";

test("publishDemoDocument creates immutable versioned manifest with content hash", () => {
  const doc = createDefaultDemoDocument("demo-pub-1");
  const step1 = {
    id: "s1",
    orderIndex: 0,
    title: "S1",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const step2 = {
    id: "s2",
    orderIndex: 1,
    title: "S2",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const docWithSteps = { ...doc, steps: [step1, step2] };

  const manifest = publishDemoDocument(docWithSteps, 0);
  assert.equal(manifest.version, 1);
  assert.equal(manifest.isPublished, true);
  assert.ok(manifest.contentHash.length > 0);

  const unpublished = unpublishDemo(manifest);
  assert.equal(unpublished.isPublished, false);
});
