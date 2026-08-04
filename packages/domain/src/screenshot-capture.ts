/**
 * Screenshot Capture Metadata & Dimension Validation — TASK-093
 */

export type CaptureMode = "viewport" | "fullpage" | "area";

export interface CapturedScreenshotMeta {
  readonly captureId: string;
  readonly mode: CaptureMode;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly devicePixelRatio: number;
  readonly capturedAtIso: string;
}

const MAX_PIXEL_DIMENSION = 8192; // Guard against memory exhaustion

export function createCapturedScreenshotRecord(
  mode: CaptureMode,
  widthPx: number,
  heightPx: number,
  devicePixelRatio = 1.0
): CapturedScreenshotMeta {
  if (widthPx <= 0 || heightPx <= 0) {
    throw new Error("Screenshot dimensions must be greater than zero.");
  }

  const clampedW = Math.min(MAX_PIXEL_DIMENSION, Math.round(widthPx));
  const clampedH = Math.min(MAX_PIXEL_DIMENSION, Math.round(heightPx));
  const clampedDpr = Math.max(1.0, Math.min(4.0, devicePixelRatio));

  return Object.freeze({
    captureId: `cap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    mode,
    widthPx: clampedW,
    heightPx: clampedH,
    devicePixelRatio: clampedDpr,
    capturedAtIso: new Date().toISOString()
  });
}
