import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateLeadQualification } from "@supademo/domain";

test("evaluateLeadQualification evaluates deterministic scores and triggers human handoff", () => {
  const answers = { company_size: "enterprise", timeline: "immediate" };
  const res = evaluateLeadQualification(answers, 70);

  assert.equal(res.score, 80);
  assert.equal(res.isQualified, true);
  assert.equal(res.needsHumanHandoff, true);
});
