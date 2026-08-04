/**
 * Canvas Coordinate Systems & Transform Mathematics — TASK-055
 *
 * Implements normalized 0-100% canvas coordinates, screen-to-canvas and
 * canvas-to-screen space conversions, zoom scaling, and media aspect ratio fitting.
 */

export type ContainerBounds = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type Point = Readonly<{
  x: number;
  y: number;
}>;

export type FittedMediaBounds = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  scaleFactor: number;
}>;

export const MIN_ZOOM_LEVEL = 0.25;
export const MAX_ZOOM_LEVEL = 4.0;
export const DEFAULT_ZOOM_LEVEL = 1.0;

/**
 * Clamp a normalized coordinate percentage between 0.0 and 100.0
 */
export function clampNormalizedCoordinate(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

/**
 * Convert pixel screen space coordinates to 0-100% normalized canvas space
 */
export function screenToCanvasCoordinates(
  screenPoint: Point,
  container: ContainerBounds,
  zoomLevel = DEFAULT_ZOOM_LEVEL
): Point {
  if (container.width <= 0 || container.height <= 0 || zoomLevel <= 0) {
    return Object.freeze({ x: 0, y: 0 });
  }

  const relativeX = (screenPoint.x - container.x) / zoomLevel;
  const relativeY = (screenPoint.y - container.y) / zoomLevel;

  const normalizedX = (relativeX / container.width) * 100;
  const normalizedY = (relativeY / container.height) * 100;

  return Object.freeze({
    x: clampNormalizedCoordinate(normalizedX),
    y: clampNormalizedCoordinate(normalizedY)
  });
}

/**
 * Convert 0-100% normalized canvas space to pixel screen space coordinates
 */
export function canvasToScreenCoordinates(
  canvasPoint: Point,
  container: ContainerBounds,
  zoomLevel = DEFAULT_ZOOM_LEVEL
): Point {
  const clampedX = clampNormalizedCoordinate(canvasPoint.x);
  const clampedY = clampNormalizedCoordinate(canvasPoint.y);

  const screenX = container.x + (clampedX / 100) * container.width * zoomLevel;
  const screenY = container.y + (clampedY / 100) * container.height * zoomLevel;

  return Object.freeze({
    x: Math.round(screenX * 100) / 100,
    y: Math.round(screenY * 100) / 100
  });
}

/**
 * Calculate fitted media dimensions inside a container maintaining original aspect ratio
 */
export function calculateMediaBounds(
  mediaWidth: number,
  mediaHeight: number,
  containerWidth: number,
  containerHeight: number,
  mode: "fit" | "cover" = "fit"
): FittedMediaBounds {
  if (mediaWidth <= 0 || mediaHeight <= 0 || containerWidth <= 0 || containerHeight <= 0) {
    return Object.freeze({ x: 0, y: 0, width: 0, height: 0, scaleFactor: 1 });
  }

  const mediaRatio = mediaWidth / mediaHeight;
  const containerRatio = containerWidth / containerHeight;

  let width: number;
  let height: number;

  if (mode === "fit") {
    if (mediaRatio > containerRatio) {
      width = containerWidth;
      height = containerWidth / mediaRatio;
    } else {
      height = containerHeight;
      width = containerHeight * mediaRatio;
    }
  } else {
    // Cover mode
    if (mediaRatio > containerRatio) {
      height = containerHeight;
      width = containerHeight * mediaRatio;
    } else {
      width = containerWidth;
      height = containerWidth / mediaRatio;
    }
  }

  const x = (containerWidth - width) / 2;
  const y = (containerHeight - height) / 2;
  const scaleFactor = width / mediaWidth;

  return Object.freeze({
    x: Math.round(x * 100) / 100,
    y: Math.round(y * 100) / 100,
    width: Math.round(width * 100) / 100,
    height: Math.round(height * 100) / 100,
    scaleFactor
  });
}

/**
 * Safely adjust zoom level within bounded limits
 */
export function zoomCanvas(
  currentZoom: number,
  deltaZoom: number,
  minZoom = MIN_ZOOM_LEVEL,
  maxZoom = MAX_ZOOM_LEVEL
): number {
  const target = currentZoom + deltaZoom;
  const rounded = Math.round(target * 100) / 100;
  return Math.max(minZoom, Math.min(maxZoom, rounded));
}
