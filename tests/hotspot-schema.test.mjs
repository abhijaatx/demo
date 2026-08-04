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

test("hotspot URL actions keep safe links and fail closed for unsafe schemes", () => {
  const safe = parseAndNormalizeHotspot({
    id: "hotspot-url",
    actionType: "open_url",
    url: "https://example.com/next"
  });
  assert.equal(safe.actionType, "open_url");
  assert.equal(safe.targetStepId, null);
  assert.equal(safe.url, "https://example.com/next");

  const unsafe = parseAndNormalizeHotspot({
    id: "hotspot-unsafe-url",
    actionType: "open_url",
    url: "javascript:alert(document.domain)"
  });
  assert.equal(unsafe.actionType, "next_step");
  assert.equal(unsafe.url, null);
});
