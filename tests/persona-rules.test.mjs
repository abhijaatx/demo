import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateConditionalText } from "@supademo/domain";

test("evaluateConditionalText evaluates matching rules and falls back when no rule matches", () => {
  const base = "Standard Enterprise Plan";
  const rules = [
    {
      ruleId: "r1",
      variableName: "role",
      equalsValue: "developer",
      overrideText: "Developer API Access Plan"
    },
    {
      ruleId: "r2",
      variableName: "role",
      equalsValue: "executive",
      overrideText: "Executive Suite Overview"
    }
  ];

  const devMatch = evaluateConditionalText(base, rules, { role: "developer" });
  assert.equal(devMatch, "Developer API Access Plan");

  const noMatch = evaluateConditionalText(base, rules, { role: "marketer" });
  assert.equal(noMatch, "Standard Enterprise Plan");
});
