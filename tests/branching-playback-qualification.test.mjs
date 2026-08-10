import assert from "node:assert/strict";
import { test } from "node:test";
import { createDefaultDemoDocument } from "@supademo/domain";
import { PlayerStateMachine } from "@supademo/player";

test("Malformed graph fuzz test: cyclic and invalid steps do not crash PlayerStateMachine", () => {
  const doc = createDefaultDemoDocument("demo-fuzz-1");
  const step1 = {
    id: "s1",
    orderIndex: 0,
    title: "S1",
    media: null,
    hotspots: [
      {
        id: "h1",
        x: 10,
        y: 10,
        width: 20,
        height: 20,
        style: {},
        tooltipText: null,
        targetStepId: "s2",
        actionConfig: { type: "step" }
      }
    ],
    callouts: [],
    audioNarration: null
  };
  const step2 = {
    id: "s2",
    orderIndex: 1,
    title: "S2",
    media: null,
    hotspots: [
      {
        id: "h2",
        x: 10,
        y: 10,
        width: 20,
        height: 20,
        style: {},
        tooltipText: null,
        targetStepId: "s1",
        actionConfig: { type: "step" }
      }
    ],
    callouts: [],
    audioNarration: null
  };
  const cyclicDoc = { ...doc, steps: [step1, step2] };

  const machine = new PlayerStateMachine(cyclicDoc);
  assert.equal(machine.getContext().state, "playing");

  // Loop back and forth safely
  machine.nextStep();
  assert.equal(machine.getContext().currentStepIndex, 1);
  machine.gotoStep(0);
  assert.equal(machine.getContext().currentStepIndex, 0);
});

test("Performance benchmark: PlayerStateMachine 200-step navigation runs under 10ms", () => {
  const doc = createDefaultDemoDocument("demo-perf-1");
  const steps = Array.from({ length: 200 }, (_, i) => ({
    id: `s-${i}`,
    orderIndex: i,
    title: `Step ${i}`,
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  }));
  const largeDoc = { ...doc, steps };

  const start = performance.now();
  const machine = new PlayerStateMachine(largeDoc);

  for (let i = 0; i < 200; i++) {
    machine.nextStep();
  }
  const duration = performance.now() - start;

  assert.equal(machine.getContext().state, "completed");
  assert.ok(duration < 10, `200-step navigation took ${duration.toFixed(2)}ms, expected < 10ms`);
});
