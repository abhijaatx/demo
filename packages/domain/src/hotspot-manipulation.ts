/**
 * Hotspot Canvas Manipulation & Alignment Guides — TASK-062
 */

import { clampNormalizedCoordinate } from "./canvas-coordinates.js";
import type { DemoHotspot } from "./demo-document.js";

export const MIN_HOTSPOT_SIZE_PERCENT = 5;

export function moveHotspot(
  hotspot: DemoHotspot,
  deltaXPercent: number,
  deltaYPercent: number
): DemoHotspot {
  const newX = clampNormalizedCoordinate(hotspot.x + deltaXPercent);
  const newY = clampNormalizedCoordinate(hotspot.y + deltaYPercent);
  return Object.freeze({
    ...hotspot,
    x: newX,
    y: newY
  });
}

export function resizeHotspot(
  hotspot: DemoHotspot,
  newWidthPercent: number,
  newHeightPercent: number,
  minSize = MIN_HOTSPOT_SIZE_PERCENT
): DemoHotspot {
  const clampedW = Math.max(minSize, clampNormalizedCoordinate(newWidthPercent));
  const clampedH = Math.max(minSize, clampNormalizedCoordinate(newHeightPercent));

  return Object.freeze({
    ...hotspot,
    width: clampedW,
    height: clampedH
  });
}

export function nudgeHotspot(
  hotspot: DemoHotspot,
  direction: "up" | "down" | "left" | "right",
  stepPercent = 1
): DemoHotspot {
  switch (direction) {
    case "left":
      return moveHotspot(hotspot, -stepPercent, 0);
    case "right":
      return moveHotspot(hotspot, stepPercent, 0);
    case "up":
      return moveHotspot(hotspot, 0, -stepPercent);
    case "down":
      return moveHotspot(hotspot, 0, stepPercent);
  }
}
