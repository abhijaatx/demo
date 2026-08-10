import assert from "node:assert/strict";
import { test } from "node:test";
import { createExplorationConfig, evaluateGoalCompletion } from "@supademo/domain";

test("createExplorationConfig & evaluateGoalCompletion manage exploration modes and goal rules", () => {
  const cfg = createExplorationConfig("free_exploration", ["click"], "#finish-btn");
  assert.equal(cfg.mode, "free_exploration");

  const completedHtml = '<button id="finish-btn">Finish</button>';
  assert.equal(evaluateGoalCompletion(completedHtml, "#finish-btn"), true);

  const incompleteHtml = '<button id="other-btn">Other</button>';
  assert.equal(evaluateGoalCompletion(incompleteHtml, "#finish-btn"), false);
});
