import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDefaultDemoDocument,
  publishDemoDocument,
  resolvePublicDemoUrl
} from "@supademo/domain";

test("resolvePublicDemoUrl resolves latest and version-pinned published manifests", () => {
  const doc = createDefaultDemoDocument("demo-res-1");
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

  const v1 = publishDemoDocument(docWithSteps, 0);
  const v2 = publishDemoDocument({ ...docWithSteps, version: "1.0.1" }, 1);

  const manifests = [v1, v2];

  const latest = resolvePublicDemoUrl("demo-res-1", manifests);
  assert.equal(latest.manifest.version, 2);
  assert.equal(latest.canonicalUrl, "/d/demo-res-1");

  const pinned = resolvePublicDemoUrl("demo-res-1:v1", manifests);
  assert.equal(pinned.manifest.version, 1);
});
