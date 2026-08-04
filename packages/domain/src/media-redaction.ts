/**
 * Non-Destructive Crop & Irreversible Server-Side Redaction — TASK-066
 */

import { clampNormalizedCoordinate } from "./canvas-coordinates.js";

export interface CropMetadata {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface RedactionRegion {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly label?: string;
  readonly isPermanent: boolean;
}

export interface RedactionBurnInManifest {
  readonly assetId: string;
  readonly cropPx: { left: number; top: number; width: number; height: number } | null;
  readonly redactionsPx: readonly {
    id: string;
    left: number;
    top: number;
    width: number;
    height: number;
  }[];
}

export function validateCropMetadata(crop: unknown): CropMetadata | null {
  if (!crop || typeof crop !== "object") return null;
  const raw = crop as Record<string, unknown>;
  const x = clampNormalizedCoordinate(Number(raw["x"] ?? 0));
  const y = clampNormalizedCoordinate(Number(raw["y"] ?? 0));
  const width = clampNormalizedCoordinate(Number(raw["width"] ?? 100));
  const height = clampNormalizedCoordinate(Number(raw["height"] ?? 100));

  if (width <= 0 || height <= 0) return null;
  return Object.freeze({ x, y, width, height });
}

export function generateRedactionBurnInManifest(
  assetId: string,
  mediaWidthPx: number,
  mediaHeightPx: number,
  crop: CropMetadata | null,
  redactions: readonly RedactionRegion[]
): RedactionBurnInManifest {
  const cropPx = crop
    ? {
        left: Math.round((crop.x / 100) * mediaWidthPx),
        top: Math.round((crop.y / 100) * mediaHeightPx),
        width: Math.round((crop.width / 100) * mediaWidthPx),
        height: Math.round((crop.height / 100) * mediaHeightPx)
      }
    : null;

  const redactionsPx = redactions
    .filter((r) => r.isPermanent)
    .map((r) => ({
      id: r.id,
      left: Math.round((r.x / 100) * mediaWidthPx),
      top: Math.round((r.y / 100) * mediaHeightPx),
      width: Math.round((r.width / 100) * mediaWidthPx),
      height: Math.round((r.height / 100) * mediaHeightPx)
    }));

  return Object.freeze({
    assetId,
    cropPx,
    redactionsPx: Object.freeze(redactionsPx)
  });
}
