import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveHotspotNavigation, diagnoseBrokenTargets } from "@supademo/domain";

test("resolveHotspotNavigation advances to next step by default", () => {
  const step1 = {
    id: "step-1",
    orderIndex: 0,
    title: "S1",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const step2 = {
    id: "step-2",
    orderIndex: 1,
    title: "S2",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const steps = [step1, step2];

  const hotspot = {
    id: "h1",
    x: 10,
    y: 10,
    width: 10,
    height: 10,
    targetStepId: null,
    tooltipText: null,
    style: { pulse: true, color: "#fff", opacity: 1 }
  };

  const res = resolveHotspotNavigation(hotspot, steps, 0);
  assert.equal(res.actionType, "next");
  assert.equal(res.targetStepIndex, 1);
  assert.equal(res.isBroken, false);
});

test("diagnoseBrokenTargets flags missing target steps", () => {
  const step1 = {
    id: "step-1",
    orderIndex: 0,
    title: "S1",
    media: null,
    hotspots: [
      {
        id: "h-valid",
        x: 10,
        y: 10,
        width: 10,
        height: 10,
        targetStepId: "step-2",
        tooltipText: null,
        style: { pulse: true, color: "#fff", opacity: 1 }
      },
      {
        id: "h-broken",
        x: 10,
        y: 10,
        width: 10,
        height: 10,
        targetStepId: "step-deleted",
        tooltipText: null,
        style: { pulse: true, color: "#fff", opacity: 1 }
      }
    ],
    callouts: [],
    audioNarration: null
  };
  const step2 = {
    id: "step-2",
    orderIndex: 1,
    title: "S2",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const steps = [step1, step2];

  const diagnostics = diagnoseBrokenTargets(steps);
  assert.equal(diagnostics.length, 1);
  assert.equal(diagnostics[0].hotspotId, "h-broken");
  assert.equal(diagnostics[0].missingTargetStepId, "step-deleted");
});
