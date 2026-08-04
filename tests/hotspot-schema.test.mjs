import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAndNormalizeHotspot, validateSafeUrl } from "@supademo/domain";

test("validateSafeUrl rejects javascript:, data:, and malformed URLs", () => {
  assert.equal(validateSafeUrl("javascript:alert(1)"), null);
  assert.equal(validateSafeUrl("data:text/html,<script>"), null);
  assert.equal(validateSafeUrl("https://supademo.com/docs"), "https://supademo.com/docs");
});

test("parseAndNormalizeHotspot clamps geometry and sets default style", () => {
  const hotspot = parseAndNormalizeHotspot({
    x: 120, // out of bounds -> 100
    y: -50, // out of bounds -> 0
    width: 25,
    height: 15,
    tooltipText: "Click here"
  });

  assert.equal(hotspot.x, 100);
  assert.equal(hotspot.y, 0);
  assert.equal(hotspot.width, 25);
  assert.equal(hotspot.height, 15);
  assert.equal(hotspot.style.color, "#4f46e5");
});
