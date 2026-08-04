import assert from "node:assert/strict";
import { test } from "node:test";
import { applyDataOverlays } from "@supademo/domain";

test("applyDataOverlays replaces original text with HTML-escaped overrides", () => {
  const html = "<h1>Welcome Acme Corp</h1>";
  const rules = [
    { selector: "h1", originalText: "Acme Corp", overrideText: "<script>alert(1)</script> Hooli" }
  ];

  const updated = applyDataOverlays(html, rules);

  assert.equal(updated.includes("&lt;script&gt;"), true);
  assert.equal(updated.includes("Hooli"), true);
  assert.equal(updated.includes("<script>"), false);
});
