"use client";

import {
  resolveTemplateTokens,
  type DemoDocument,
  type DemoHotspot,
  type DemoStep,
  type DemoStepMedia
} from "@supademo/domain";
import type { LocalCaptureBundle } from "./local-capture-storage";

type CreateObjectUrl = (blob: Blob) => string;

function isCaptureOwnedStep(stepId: string, captureId: string): boolean {
  return (
    stepId.startsWith(`local-step-${captureId}`) ||
    stepId.startsWith(`local-video-step-${captureId}`) ||
    stepId.startsWith(`local-image-step-${captureId}`) ||
    stepId.startsWith(`local-html-step-${captureId}`) ||
    stepId.startsWith(`local-upload-step-${captureId}`)
  );
}

function withoutStaleBlobMedia(step: DemoStep): DemoStep {
  if (!step.media?.storagePath.startsWith("blob:")) return step;
  return { ...step, media: null };
}

export function createDocumentFromLocalCapture(
  baseDocument: DemoDocument,
  bundle: LocalCaptureBundle,
  createObjectUrl: CreateObjectUrl
): DemoDocument {
  const createStep = (
    id: string,
    title: string,
    description: string | null,
    assetType: DemoStepMedia["assetType"],
    blob: Blob | null,
    width: number | null = null,
    height: number | null = null,
    options: {
      hotspots?: readonly DemoHotspot[];
      crop?: DemoStepMedia["crop"];
      fit?: DemoStepMedia["fit"];
      durationSeconds?: number | null;
      disableViewerScroll?: boolean;
    } = {}
  ): DemoStep => ({
    id,
    orderIndex: 0,
    title: title.slice(0, 160) || "Imported local step",
    description,
    media: blob
      ? {
          assetId: `local-asset-${id}`,
          assetType,
          storagePath: createObjectUrl(blob),
          width,
          height,
          durationSeconds: options.durationSeconds ?? null,
          posterPath: null,
          ...(options.crop ? { crop: options.crop } : {}),
          ...(options.fit ? { fit: options.fit } : {})
        }
      : null,
    hotspots: options.hotspots || [],
    callouts: [],
    audioNarration: null,
    ...(options.disableViewerScroll ? { disableViewerScroll: true } : {})
  });

  let steps: DemoStep[];
  if ((bundle.kind === "video" || bundle.kind === "video-split") && bundle.blob) {
    const videoBlob = bundle.blob;
    const videoHotspots: readonly DemoHotspot[] = (bundle.videoHotspots || []).map(
      (hotspot, index) => ({
        id: `local-video-hotspot-${bundle.id}-${index + 1}`,
        x: 76,
        y: 74,
        width: 20,
        height: 14,
        targetStepId: null,
        tooltipText: `${hotspot.title}${hotspot.body ? `: ${hotspot.body}` : ""}`,
        actionType: "none",
        timing: {
          kind: hotspot.kind,
          startSeconds: hotspot.timeSeconds,
          endSeconds: hotspot.kind === "duration" ? hotspot.endTimeSeconds : null
        },
        style: { pulse: true, color: "#4f46e5", opacity: 0.8 }
      })
    );
    const segments = bundle.kind === "video-split" ? bundle.segments || [] : [];
    const screenshots = [...(bundle.screenshots || [])].sort(
      (left, right) => (left.atSeconds || 0) - (right.atSeconds || 0)
    );
    if (!segments.length) {
      steps = [
        createStep(
          `local-step-${bundle.id}`,
          bundle.title || "Desktop recording",
          "Imported local recording.",
          "video",
          videoBlob,
          null,
          null,
          {
            hotspots: videoHotspots,
            durationSeconds: bundle.videoDurationSeconds ?? null
          }
        )
      ];
    } else {
      const videoSteps = segments.map((segment, index) =>
        createStep(
          `local-video-step-${bundle.id}-${index + 1}`,
          `${bundle.title || "Video"} · ${segment.startSeconds.toFixed(2)}–${segment.endSeconds.toFixed(2)}s`,
          `Video segment from ${segment.startSeconds.toFixed(2)}s to ${segment.endSeconds.toFixed(2)}s at ${segment.speed}×${segment.muted ? ", muted" : ""}.`,
          "video",
          videoBlob,
          null,
          null,
          { durationSeconds: segment.endSeconds - segment.startSeconds }
        )
      );
      const combined: Array<{ at: number; order: number; step: DemoStep }> = [];
      videoSteps.forEach((step, index) => {
        combined.push({ at: segments[index]?.startSeconds || 0, order: index * 2, step });
      });
      screenshots.forEach((screenshot, index) => {
        combined.push({
          at: screenshot.atSeconds || 0,
          order: index * 2 + 1,
          step: createStep(
            `local-image-step-${bundle.id}-${index + 1}`,
            screenshot.title || `Image step ${index + 1}`,
            screenshot.description ||
              `Frame captured at ${(screenshot.atSeconds || 0).toFixed(2)}s.`,
            "screenshot",
            screenshot.blob,
            screenshot.width,
            screenshot.height
          )
        });
      });
      combined.sort((left, right) => left.at - right.at || left.order - right.order);
      steps = combined.map(({ step }) => step);
    }
  } else if (bundle.kind === "html") {
    const assets = new Map((bundle.assets || []).map((asset) => [asset.id, asset]));
    const variables = bundle.htmlVariables || {};
    steps = (bundle.htmlNodes || [])
      .filter((node) => !node.hidden)
      .map((node, index) => {
        const imageAsset =
          !node.redacted && node.imageAssetId ? assets.get(node.imageAssetId) : undefined;
        const description = node.redacted
          ? "[REDACTED]"
          : resolveTemplateTokens(node.text, variables) || "Captured HTML element.";
        return createStep(
          `local-html-step-${bundle.id}-${index + 1}`,
          node.redacted ? "Redacted element" : node.label || `HTML element ${index + 1}`,
          description.slice(0, 400),
          imageAsset ? "image" : "document",
          imageAsset?.blob || null,
          imageAsset?.width || null,
          imageAsset?.height || null,
          {
            crop: imageAsset?.crop,
            fit: imageAsset?.fit,
            disableViewerScroll: bundle.htmlDisableScroll === true
          }
        );
      });
  } else if (bundle.kind === "upload") {
    steps = (bundle.assets || []).map((asset) =>
      createStep(
        `local-upload-step-${bundle.id}-${asset.id}`,
        asset.title,
        asset.description || "Imported local upload.",
        asset.assetType === "image" ? "image" : asset.assetType,
        asset.blob,
        asset.width,
        asset.height,
        { crop: asset.crop, fit: asset.fit }
      )
    );
  } else {
    steps = (bundle.screenshots || []).map((screenshot, index) =>
      createStep(
        `local-step-${bundle.id}-${index + 1}`,
        screenshot.title || `Desktop capture ${index + 1}`,
        screenshot.description || "Imported local desktop screenshot.",
        "screenshot",
        screenshot.blob,
        screenshot.width,
        screenshot.height
      )
    );
  }

  return {
    ...baseDocument,
    steps: steps.map((step, index) => ({ ...step, orderIndex: index })),
    updatedAtIso: new Date().toISOString()
  };
}

/**
 * Replaces transient object URLs with fresh URLs from IndexedDB while keeping
 * creator edits. Capture-owned steps that no longer exist in the sanitized
 * bundle are omitted so hidden/redacted source content cannot reappear.
 */
export function rehydrateLocalCaptureDocument(
  captureDocument: DemoDocument,
  storedDocument: DemoDocument,
  captureId: string
): DemoDocument {
  const freshById = new Map(captureDocument.steps.map((step) => [step.id, step]));
  const steps = storedDocument.steps
    .filter((step) => freshById.has(step.id) || !isCaptureOwnedStep(step.id, captureId))
    .map((storedStep) => {
      const freshStep = freshById.get(storedStep.id);
      if (!freshStep) return withoutStaleBlobMedia(storedStep);
      if (!freshStep.media) return { ...storedStep, media: null };
      const compatibleMedia =
        storedStep.media?.assetId === freshStep.media.assetId ? storedStep.media : freshStep.media;
      return {
        ...storedStep,
        media: {
          ...compatibleMedia,
          storagePath: freshStep.media.storagePath,
          posterPath: freshStep.media.posterPath
        }
      };
    })
    .map((step, index) => ({ ...step, orderIndex: index }));

  return {
    ...storedDocument,
    steps,
    updatedAtIso: new Date().toISOString()
  };
}
