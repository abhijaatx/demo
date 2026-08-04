import assert from "node:assert/strict";
import { test } from "node:test";
import { createDefaultDemoDocument, generateBranchingDiagnosticSummary } from "@supademo/domain";

test("generateBranchingDiagnosticSummary computes total nodes, edges, and publishability", () => {
  const doc = createDefaultDemoDocument("demo-branch-1");
  const step1 = {
    id: "s-1",
    orderIndex: 0,
    title: "S1",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const step2 = {
    id: "s-2",
    orderIndex: 1,
    title: "S2",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const docWithSteps = { ...doc, steps: [step1, step2] };

  const summary = generateBranchingDiagnosticSummary(docWithSteps);
  assert.equal(summary.totalNodes, 2);
  assert.equal(summary.totalEdges, 1);
  assert.equal(summary.isPublishable, true);
  assert.equal(summary.missingTargetCount, 0);
});
