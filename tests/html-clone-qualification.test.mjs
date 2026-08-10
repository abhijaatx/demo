import assert from "node:assert/strict";
import { test } from "node:test";
import { qualifyHtmlCloneSecurity } from "@supademo/domain";

test("qualifyHtmlCloneSecurity tests corpus of malicious XSS payloads and verifies complete blocking", () => {
  const corpus = [
    "<script>alert(1)</script>",
    '<img src="x" onerror="alert(2)" />',
    '<a href="javascript:alert(3)">Click</a>'
  ];

  const result = qualifyHtmlCloneSecurity(corpus);

  assert.equal(result.isPassed, true);
  assert.equal(result.maliciousFixturesBlocked, 3);
  assert.equal(result.totalFixturesTested, 3);
});
