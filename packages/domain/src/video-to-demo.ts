/**
 * Video-to-Demo Proposal Pipeline & Scene Cut Analysis — TASK-110
 */

import { createDefaultDemoDocument, type DemoDocument, type DemoStep } from "./demo-document.js";

export interface VideoSceneCut {
  readonly timestampSeconds: number;
  readonly confidenceScore: number;
  readonly candidateTitle: string;
}

export function proposeVideoToDemoSteps(
  videoAssetId: string,
  sceneCuts: readonly VideoSceneCut[],
  workspaceId: string
): DemoDocument {
  if (!sceneCuts || sceneCuts.length === 0) {
    throw new Error("Must provide at least one scene cut proposal.");
  }

  const baseDoc = createDefaultDemoDocument(`v2d-${videoAssetId}`);

  const steps: DemoStep[] = sceneCuts.map((cut, idx) => {
    return Object.freeze({
      id: `step-${idx + 1}`,
      orderIndex: idx,
      title: cut.candidateTitle || `Scene ${idx + 1}`,
      description: `Proposed from video scene cut at ${cut.timestampSeconds.toFixed(1)}s (confidence: ${(cut.confidenceScore * 100).toFixed(0)}%)`,
      media: Object.freeze({
        assetId: videoAssetId,
        assetType: "video" as const,
        storagePath: `/uploads/videos/${videoAssetId}.mp4`,
        width: 1920,
        height: 1080,
        durationSeconds: cut.timestampSeconds,
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
