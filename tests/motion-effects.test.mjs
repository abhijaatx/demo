import assert from "node:assert/strict";
import { test } from "node:test";
import { parseAndNormalizeMotionConfig, resolveEffectiveMotionConfig } from "@supademo/domain";

test("parseAndNormalizeMotionConfig bounds focus and zoom scale", () => {
  const config = parseAndNormalizeMotionConfig({
    focusX: 120, // -> 100
    focusY: 30,
    zoomScale: 5.0, // -> 3.0
    transitionType: "fade",
    durationMs: 500
  });

  assert.equal(config.focusX, 100);
  assert.equal(config.focusY, 30);
  assert.equal(config.zoomScale, 3.0);
  assert.equal(config.transitionType, "fade");
  assert.equal(config.durationMs, 500);
});

test("resolveEffectiveMotionConfig strips zoom and transitions when reduced motion is preferred", () => {
  const config = {
    focusX: 50,
    focusY: 50,
    zoomScale: 2.0,
    transitionType: "zoom",
    durationMs: 800
  };
  const effective = resolveEffectiveMotionConfig(config, true);

  assert.equal(effective.zoomScale, 1.0);
  assert.equal(effective.transitionType, "none");
  assert.equal(effective.durationMs, 0);
});
