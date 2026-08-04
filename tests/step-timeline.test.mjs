import assert from "node:assert/strict";
import { test } from "node:test";
import {
  reorderSteps,
  duplicateStep,
  deleteSteps,
  previewBulkAssetReplacementImpact,
  applyBulkAssetReplacement
} from "@supademo/domain";

test("reorderSteps moves step correctly and updates orderIndex", () => {
  const stepA = {
    id: "s-1",
    orderIndex: 0,
    title: "A",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const stepB = {
    id: "s-2",
    orderIndex: 1,
    title: "B",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const stepC = {
    id: "s-3",
    orderIndex: 2,
    title: "C",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const steps = [stepA, stepB, stepC];

  const reordered = reorderSteps(steps, 0, 2); // Move A to end [B, C, A]
  assert.equal(reordered[0].id, "s-2");
  assert.equal(reordered[0].orderIndex, 0);
  assert.equal(reordered[1].id, "s-3");
  assert.equal(reordered[1].orderIndex, 1);
  assert.equal(reordered[2].id, "s-1");
  assert.equal(reordered[2].orderIndex, 2);
});

test("duplicateStep creates deep copy with unique IDs", () => {
  const step = {
    id: "orig-1",
    orderIndex: 0,
    title: "Original",
    media: null,
    hotspots: [
      {
        id: "h-1",
        x: 10,
        y: 10,
        width: 10,
        height: 10,
        targetStepId: null,
        tooltipText: "Hi",
        style: { pulse: true, color: "#fff", opacity: 1 }
      }
    ],
    callouts: [{ id: "c-1", title: "Info", body: "Body", position: "bottom", stepId: "orig-1" }],
    audioNarration: null
  };

  const copy = duplicateStep(step);
  assert.notEqual(copy.id, "orig-1");
  assert.match(copy.title, /Copy/u);
  assert.notEqual(copy.hotspots[0].id, "h-1");
  assert.notEqual(copy.callouts[0].id, "c-1");
  assert.equal(copy.callouts[0].stepId, copy.id);
});

test("deleteSteps removes target steps and re-indexes remaining steps", () => {
  const steps = [
    {
      id: "s-1",
      orderIndex: 0,
      title: "A",
      media: null,
      hotspots: [],
      callouts: [],
      audioNarration: null
    },
    {
      id: "s-2",
      orderIndex: 1,
      title: "B",
      media: null,
      hotspots: [],
      callouts: [],
      audioNarration: null
    },
    {
      id: "s-3",
      orderIndex: 2,
      title: "C",
      media: null,
      hotspots: [],
      callouts: [],
      audioNarration: null
    }
  ];

  const remaining = deleteSteps(steps, new Set(["s-2"]));
  assert.equal(remaining.length, 2);
  assert.equal(remaining[0].id, "s-1");
  assert.equal(remaining[0].orderIndex, 0);
  assert.equal(remaining[1].id, "s-3");
  assert.equal(remaining[1].orderIndex, 1);
});

test("previewBulkAssetReplacementImpact and applyBulkAssetReplacement calculate and perform asset swap", () => {
  const media1 = {
    assetId: "ast-old",
    assetType: "image",
    storagePath: "/old.png",
    width: 100,
    height: 100,
    durationSeconds: null,
    posterPath: null
  };
  const media2 = {
    assetId: "ast-other",
    assetType: "image",
    storagePath: "/other.png",
    width: 100,
    height: 100,
    durationSeconds: null,
    posterPath: null
  };
  const steps = [
    {
      id: "s-1",
      orderIndex: 0,
      title: "A",
      media: media1,
      hotspots: [],
      callouts: [],
      audioNarration: null
    },
    {
      id: "s-2",
      orderIndex: 1,
      title: "B",
      media: media2,
      hotspots: [],
      callouts: [],
      audioNarration: null
    }
  ];

  const impact = previewBulkAssetReplacementImpact(steps, "ast-old", "ast-new");
  assert.equal(impact.affectedStepCount, 1);

  const newMedia = {
    assetId: "ast-new",
    assetType: "image",
    storagePath: "/new.png",
    width: 100,
    height: 100,
    durationSeconds: null,
    posterPath: null
  };
  const updated = applyBulkAssetReplacement(steps, "ast-old", newMedia);
  assert.equal(updated[0].media.assetId, "ast-new");
  assert.equal(updated[1].media.assetId, "ast-other");
});
