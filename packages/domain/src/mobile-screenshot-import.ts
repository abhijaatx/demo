/**
 * Mobile/Tablet Screenshot Import & Orientation Detection — TASK-108
 */

export type DeviceFramePreset = "iphone-15-pro" | "pixel-8" | "ipad-pro" | "none";
export type ImageOrientation = "portrait" | "landscape";

export interface MobileImportItem {
  readonly fileId: string;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly orientation: ImageOrientation;
  readonly deviceFrame: DeviceFramePreset;
}

export function detectOrientation(widthPx: number, heightPx: number): ImageOrientation {
  return heightPx >= widthPx ? "portrait" : "landscape";
}

export function createMobileImportItem(
  fileId: string,
  widthPx: number,
  heightPx: number,
  deviceFrame: DeviceFramePreset = "iphone-15-pro"
): MobileImportItem {
  if (widthPx <= 0 || heightPx <= 0) {
    throw new Error("Dimensions must be greater than zero.");
  }

  const orientation = detectOrientation(widthPx, heightPx);

  return Object.freeze({
    fileId,
    widthPx,
    heightPx,
    orientation,
    deviceFrame
  });
}
