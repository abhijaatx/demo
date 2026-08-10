import assert from "node:assert/strict";
import { test } from "node:test";
import { moveHotspot, resizeHotspot, nudgeHotspot } from "@supademo/domain";

test("moveHotspot moves hotspot position and clamps within 0-100", () => {
  const hotspot = {
    id: "h1",
    x: 50,
    y: 50,
    width: 20,
    height: 20,
    targetStepId: null,
    tooltipText: "Hi",
    style: { pulse: true, color: "#fff", opacity: 1 }
  };

  const moved = moveHotspot(hotspot, 10, -20);
  assert.equal(moved.x, 60);
  assert.equal(moved.y, 30);

  const overflow = moveHotspot(hotspot, 80, 80);
  assert.equal(overflow.x, 100);
  assert.equal(overflow.y, 100);
});

test("resizeHotspot resizes hotspot width/height and respects minimum size", () => {
  const hotspot = {
    id: "h1",
    x: 10,
    y: 10,
    width: 20,
    height: 20,
    targetStepId: null,
    tooltipText: "Hi",
    style: { pulse: true, color: "#fff", opacity: 1 }
  };

  const resized = resizeHotspot(hotspot, 30, 40);
  assert.equal(resized.width, 30);
  assert.equal(resized.height, 40);

  const tooSmall = resizeHotspot(hotspot, 1, 2);
  assert.equal(tooSmall.width, 5); // MIN_HOTSPOT_SIZE_PERCENT
  assert.equal(tooSmall.height, 5);
});

test("nudgeHotspot moves hotspot via directional arrow step", () => {
  const hotspot = {
    id: "h1",
    x: 50,
    y: 50,
    width: 20,
    height: 20,
    targetStepId: null,
    tooltipText: "Hi",
    style: { pulse: true, color: "#fff", opacity: 1 }
  };

  assert.equal(nudgeHotspot(hotspot, "up", 2).y, 48);
  assert.equal(nudgeHotspot(hotspot, "down", 2).y, 52);
  assert.equal(nudgeHotspot(hotspot, "left", 5).x, 45);
  assert.equal(nudgeHotspot(hotspot, "right", 5).x, 55);
});
