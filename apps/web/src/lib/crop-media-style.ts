import type { CropMetadata } from "@supademo/domain";
import type { CSSProperties } from "react";

function bounded(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));
}

/**
 * Maps a normalized crop rectangle to the full preview viewport. Independent
 * X/Y scales are required: using only the smaller crop dimension also removes
 * content from the untouched axis.
 */
export function croppedMediaStyle(
  crop: CropMetadata | null | undefined,
  fit: "cover" | "contain" = "cover"
): CSSProperties | undefined {
  if (!crop) return undefined;
  const width = bounded(crop.width, 1, 100);
  const height = bounded(crop.height, 1, 100);
  const x = bounded(crop.x, 0, 100 - width);
  const y = bounded(crop.y, 0, 100 - height);
  const scaleX = 100 / width;
  const scaleY = 100 / height;
  return {
    objectFit: fit,
    objectPosition: "center",
    transformOrigin: "top left",
    transform: `translate(${-x * scaleX}%, ${-y * scaleY}%) scale(${scaleX}, ${scaleY})`
  };
}
