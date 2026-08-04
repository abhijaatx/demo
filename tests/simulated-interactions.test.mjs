import assert from "node:assert/strict";
import { test } from "node:test";
import { createSimulatedInteractionAction } from "@supademo/domain";

test("createSimulatedInteractionAction constructs declarative non-Turing-complete interaction primitives", () => {
  const act = createSimulatedInteractionAction("act-1", "#btn-submit", "click", "#modal-success");

  assert.equal(act.actionId, "act-1");
  assert.equal(act.actionKind, "click");
  assert.equal(act.targetSelector, "#modal-success");

  assert.throws(
    () => createSimulatedInteractionAction("", "", "click", ""),
    /Action ID, trigger selector, and target selector are required/
  );
});
