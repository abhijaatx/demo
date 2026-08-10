/**
 * Figma Frame Ingestion & Demo Document Conversion — TASK-109
 */

import { createDefaultDemoDocument, type DemoDocument, type DemoStep } from "./demo-document.js";

export interface FigmaFrameItem {
  readonly frameId: string;
  readonly frameName: string;
  readonly imageUrl: string;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly orderIndex: number;
}

export interface FigmaImportPayload {
  readonly fileKey: string;
  readonly frames: readonly FigmaFrameItem[];
  readonly importedAtIso: string;
}

export function createFigmaImportPayload(
  fileKey: string,
  frames: readonly FigmaFrameItem[]
): FigmaImportPayload {
  if (!fileKey.trim()) {
    throw new Error("Figma fileKey cannot be empty.");
  }
  if (!frames || frames.length === 0) {
    throw new Error("Must provide at least one Figma frame to import.");
  }

  const sorted = [...frames].sort((a, b) => a.orderIndex - b.orderIndex);

  return Object.freeze({
    fileKey: fileKey.trim(),
    frames: Object.freeze(sorted),
    importedAtIso: new Date().toISOString()
  });
}

export function convertFigmaFramesToDemoDocument(
  payload: FigmaImportPayload,
  workspaceId: string
): DemoDocument {
  const baseDoc = createDefaultDemoDocument(`figma-${payload.fileKey}`);

  const steps: DemoStep[] = payload.frames.map((frame, idx) => {
    return Object.freeze({
      id: `step-${idx + 1}`,
      orderIndex: idx,
      title: frame.frameName || `Frame ${idx + 1}`,
      description: null,
      media: Object.freeze({
        assetId: `figma-asset-${frame.frameId}`,
        assetType: "image" as const,
        storagePath: frame.imageUrl,
        width: frame.widthPx,
        height: frame.heightPx,
        durationSeconds: null,
        posterPath: null
      }),
      hotspots: Object.freeze([]),
      callouts: Object.freeze([]),
      audioNarration: null
    });
  });

  return Object.freeze({
    ...baseDoc,
    workspaceId,
    steps: Object.freeze(steps)
  });
}
