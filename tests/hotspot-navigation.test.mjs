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

test("resolveHotspotNavigation keeps no-action informational hotspots inert", () => {
  const result = resolveHotspotNavigation(
    {
      id: "timed-note",
      x: 10,
      y: 10,
      width: 20,
      height: 12,
      targetStepId: null,
      tooltipText: "Notice this setting",
      actionType: "none",
      timing: { kind: "duration", startSeconds: 2, endSeconds: 4 },
      style: { pulse: false, color: "#4f46e5", opacity: 0.8 }
    },
    [
      {
        id: "step-1",
        orderIndex: 0,
        title: "Step",
        description: null,
        media: null,
        hotspots: [],
        callouts: [],
        audioNarration: null
      },
      {
        id: "step-2",
        orderIndex: 1,
        title: "Next",
        description: null,
        media: null,
        hotspots: [],
        callouts: [],
        audioNarration: null
      }
    ],
    0
  );
  assert.equal(result.actionType, "none");
  assert.equal(result.targetStepIndex, null);
  assert.equal(result.isBroken, false);
});

test("resolveHotspotNavigation returns validated external URL actions", () => {
  const result = resolveHotspotNavigation(
    {
      id: "external-link",
      x: 10,
      y: 10,
      width: 20,
      height: 12,
      targetStepId: null,
      tooltipText: "Read the docs",
      actionType: "open_url",
      url: "https://example.com/docs",
      style: { pulse: false, color: "#4f46e5", opacity: 0.8 }
    },
    [],
    0
  );

  assert.equal(result.actionType, "url");
  assert.equal(result.url, "https://example.com/docs");
  assert.equal(result.isBroken, false);

  const unsafe = resolveHotspotNavigation(
    {
      id: "unsafe-link",
      x: 10,
      y: 10,
      width: 20,
      height: 12,
      targetStepId: null,
      tooltipText: "Unsafe",
      actionType: "open_url",
      url: "javascript:alert(1)",
      style: { pulse: false, color: "#4f46e5", opacity: 0.8 }
    },
    [],
    0
  );
  assert.equal(unsafe.actionType, "url");
  assert.equal(unsafe.url, null);
  assert.equal(unsafe.isBroken, true);
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
