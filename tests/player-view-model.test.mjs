import assert from "node:assert/strict";
import { test } from "node:test";
import { createDefaultDemoDocument } from "@supademo/domain";
import { computePlayerStepRenderState } from "@supademo/player";

test("computePlayerStepRenderState calculates progress and step state correctly", () => {
  const doc = createDefaultDemoDocument("demo-view-1");
  const step1 = {
    id: "s1",
    orderIndex: 0,
    title: "Step One",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const step2 = {
    id: "s2",
    orderIndex: 1,
    title: "Step Two",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const docWithSteps = { ...doc, steps: [step1, step2] };

  const renderState = computePlayerStepRenderState(docWithSteps, 0);
  assert.equal(renderState.currentStepNumber, 1);
  assert.equal(renderState.totalSteps, 2);
  assert.equal(renderState.progressPercentage, 50);
  assert.equal(renderState.isFirstStep, true);
  assert.equal(renderState.isLastStep, false);
});
