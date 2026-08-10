/**
 * Accessible Responsive Player View Model — TASK-076
 */

import type { DemoDocument, DemoHotspot } from "@supademo/domain";

export interface PlayerStepRenderState {
  readonly stepId: string;
  readonly stepTitle: string;
  readonly currentStepNumber: number;
  readonly totalSteps: number;
  readonly mediaStoragePath: string | null;
  readonly hotspots: readonly DemoHotspot[];
  readonly progressPercentage: number;
  readonly isFirstStep: boolean;
  readonly isLastStep: boolean;
}

export function computePlayerStepRenderState(
  document: DemoDocument,
  currentStepIndex: number
): PlayerStepRenderState | null {
  if (!document || document.steps.length === 0) return null;

  const totalSteps = document.steps.length;
  const clampedIndex = Math.max(0, Math.min(totalSteps - 1, currentStepIndex));
  const step = document.steps[clampedIndex]!;

  const progressPercentage = Math.round(((clampedIndex + 1) / totalSteps) * 100);

  return Object.freeze({
    stepId: step.id,
    stepTitle: step.title,
    currentStepNumber: clampedIndex + 1,
    totalSteps,
    mediaStoragePath: step.media?.storagePath ?? null,
    hotspots: step.hotspots,
    progressPercentage,
    isFirstStep: clampedIndex === 0,
    isLastStep: clampedIndex === totalSteps - 1
  });
}
