import assert from "node:assert/strict";
import { test } from "node:test";
import { createDefaultDemoDocument } from "@supademo/domain";
import { PlayerStateMachine } from "@supademo/player";

test("PlayerStateMachine executes deterministic step transitions and completion", () => {
  const doc = createDefaultDemoDocument("demo-play-1");
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

  const machine = new PlayerStateMachine(docWithSteps);
  assert.equal(machine.getContext().state, "playing");
  assert.equal(machine.getContext().currentStepIndex, 0);

  machine.nextStep();
  assert.equal(machine.getContext().currentStepIndex, 1);

  machine.nextStep();
  assert.equal(machine.getContext().state, "completed");

  machine.restart();
  assert.equal(machine.getContext().state, "playing");
  assert.equal(machine.getContext().currentStepIndex, 0);
});

test("PlayerStateMachine transitions to error state on malformed document", () => {
  const machine = new PlayerStateMachine();
  machine.loadDocument(null);
  assert.equal(machine.getContext().state, "error");
});
