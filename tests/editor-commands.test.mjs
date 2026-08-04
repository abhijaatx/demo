import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDefaultDemoDocument,
  CommandHistory,
  UpdateStepTitleCommand,
  AddHotspotCommand,
  ReorderStepsCommand
} from "@supademo/domain";

test("CommandHistory executes, undoes, and redoes commands deterministically", () => {
  const doc = createDefaultDemoDocument("demo-cmd-1");
  const step = {
    id: "s-10",
    orderIndex: 0,
    title: "Initial Title",
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const docWithStep = { ...doc, steps: [step] };

  const history = new CommandHistory(docWithStep);
  assert.equal(history.canUndo(), false);
  assert.equal(history.canRedo(), false);

  // 1. Execute UpdateStepTitleCommand
  const cmd1 = new UpdateStepTitleCommand("s-10", "Initial Title", "Updated Title");
  history.executeCommand(cmd1);
  assert.equal(history.canUndo(), true);
  assert.equal(history.getDocument().steps[0].title, "Updated Title");

  // 2. Undo
  history.undo();
  assert.equal(history.getDocument().steps[0].title, "Initial Title");
  assert.equal(history.canRedo(), true);

  // 3. Redo
  history.redo();
  assert.equal(history.getDocument().steps[0].title, "Updated Title");
});

test("AddHotspotCommand & ReorderStepsCommand undo and redo cleanly", () => {
  const doc = createDefaultDemoDocument("demo-cmd-2");
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

  const history = new CommandHistory(docWithSteps);

  // Add Hotspot
  const hotspot = {
    id: "h-99",
    x: 20,
    y: 30,
    width: 10,
    height: 10,
    targetStepId: null,
    tooltipText: "Test",
    style: { pulse: true, color: "#fff", opacity: 1 }
  };
  history.executeCommand(new AddHotspotCommand("s-1", hotspot));
  assert.equal(history.getDocument().steps[0].hotspots.length, 1);

  history.undo();
  assert.equal(history.getDocument().steps[0].hotspots.length, 0);

  // Reorder
  history.executeCommand(new ReorderStepsCommand(0, 1));
  assert.equal(history.getDocument().steps[0].id, "s-2");

  history.undo();
  assert.equal(history.getDocument().steps[0].id, "s-1");
});
