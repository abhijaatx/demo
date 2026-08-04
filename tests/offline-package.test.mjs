import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDefaultDemoDocument,
  publishDemoDocument,
  createOfflinePackage,
  verifyOfflinePackageIntegrity
} from "@supademo/domain";

test("createOfflinePackage creates verifiable offline package with integrity hash", () => {
  const doc = createDefaultDemoDocument("demo-off-1");
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
  const pkg = createOfflinePackage(manifest, 30);

  assert.equal(verifyOfflinePackageIntegrity(pkg), true);

  const corruptedPkg = { ...pkg, integrityHash: "tampered-hash" };
  assert.equal(verifyOfflinePackageIntegrity(corruptedPkg), false);
});
