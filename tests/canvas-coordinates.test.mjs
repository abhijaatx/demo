import assert from "node:assert/strict";
import { test } from "node:test";
import {
  screenToCanvasCoordinates,
  canvasToScreenCoordinates,
  calculateMediaBounds,
  clampNormalizedCoordinate,
  zoomCanvas
} from "@supademo/domain";

test("screenToCanvasCoordinates & canvasToScreenCoordinates round-trip accurately", () => {
  const container = { x: 100, y: 50, width: 800, height: 600 };
  const zoom = 1.5;

  // Screen point at container center (x=700, y=500 in screen pixels)
  // relative to container (x=100, y=50): offset = (600, 450)
  // with zoom 1.5: unzoomed offset = (400, 300) which is 50%, 50% of (800, 600)
  const screenPoint = { x: 700, y: 500 };
  const canvasPoint = screenToCanvasCoordinates(screenPoint, container, zoom);

  assert.equal(canvasPoint.x, 50);
  assert.equal(canvasPoint.y, 50);

  const reconstructed = canvasToScreenCoordinates(canvasPoint, container, zoom);
  assert.equal(reconstructed.x, 700);
  assert.equal(reconstructed.y, 500);
});

test("clampNormalizedCoordinate bounds values between 0 and 100", () => {
  assert.equal(clampNormalizedCoordinate(-10), 0);
  assert.equal(clampNormalizedCoordinate(150), 100);
  assert.equal(clampNormalizedCoordinate(42.5), 42.5);
  assert.equal(clampNormalizedCoordinate(NaN), 0);
});

test("calculateMediaBounds calculates centered fit bounds", () => {
  // 1920x1080 (16:9) image into 800x600 container
  const bounds = calculateMediaBounds(1920, 1080, 800, 600, "fit");
  assert.equal(bounds.width, 800);
  assert.equal(bounds.height, 450);
  assert.equal(bounds.x, 0);
  assert.equal(bounds.y, 75); // (600 - 450) / 2 = 75
});

test("zoomCanvas bounds zoom level within min and max limits", () => {
  assert.equal(zoomCanvas(1.0, 0.5), 1.5);
  assert.equal(zoomCanvas(1.0, -2.0), 0.25); // min zoom
  assert.equal(zoomCanvas(3.5, 1.0), 4.0); // max zoom
});
