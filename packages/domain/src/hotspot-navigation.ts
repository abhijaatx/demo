/**
 * Hotspot Actions & Internal Navigation Diagnostics — TASK-064
 */

import type { DemoHotspot, DemoStep } from "./demo-document.js";
import { validateSafeUrl } from "./hotspot-schema.js";

export type ResolvedNavigationResult = Readonly<{
  actionType: "next" | "prev" | "step" | "url" | "none";
  targetStepIndex: number | null;
  targetStepId: string | null;
  url: string | null;
  isBroken: boolean;
  diagnosticReason: string | null;
}>;

export function resolveHotspotNavigation(
  hotspot: DemoHotspot,
  steps: readonly DemoStep[],
  currentStepIndex: number
): ResolvedNavigationResult {
  if (hotspot.actionType === "open_url") {
    const url = validateSafeUrl(hotspot.url);
    return Object.freeze({
      actionType: "url",
      targetStepIndex: null,
      targetStepId: null,
      url,
      isBroken: !url,
      diagnosticReason: url ? null : "Hotspot URL is missing or unsafe."
    });
  }

  // If targetStepId is explicitly set
  if (hotspot.targetStepId) {
    const targetIdx = steps.findIndex((s) => s.id === hotspot.targetStepId);
    if (targetIdx === -1) {
      return Object.freeze({
        actionType: "step",
        targetStepIndex: null,
        targetStepId: hotspot.targetStepId,
        url: null,
        isBroken: true,
        diagnosticReason: `Target step '${hotspot.targetStepId}' no longer exists in the demo.`
      });
    }
    return Object.freeze({
      actionType: "step",
      targetStepIndex: targetIdx,
      targetStepId: hotspot.targetStepId,
      url: null,
      isBroken: false,
      diagnosticReason: null
    });
  }

  // Default action is advance to next step
  const nextIdx = currentStepIndex + 1;
  if (nextIdx < steps.length) {
    return Object.freeze({
      actionType: "next",
      targetStepIndex: nextIdx,
      targetStepId: steps[nextIdx]?.id ?? null,
      url: null,
      isBroken: false,
      diagnosticReason: null
    });
  }

  // Final step
  return Object.freeze({
    actionType: "none",
    targetStepIndex: null,
    targetStepId: null,
    url: null,
    isBroken: false,
    diagnosticReason: "Hotspot is on the final step."
  });
}

export interface BrokenHotspotDiagnostic {
  readonly stepId: string;
  readonly stepIndex: number;
  readonly hotspotId: string;
  readonly missingTargetStepId: string;
}

export function diagnoseBrokenTargets(
  steps: readonly DemoStep[]
): readonly BrokenHotspotDiagnostic[] {
  const stepIdSet = new Set(steps.map((s) => s.id));
  const diagnostics: BrokenHotspotDiagnostic[] = [];

  steps.forEach((step, stepIndex) => {
    step.hotspots.forEach((hotspot) => {
      if (hotspot.targetStepId && !stepIdSet.has(hotspot.targetStepId)) {
        diagnostics.push(
          Object.freeze({
            stepId: step.id,
            stepIndex,
            hotspotId: hotspot.id,
            missingTargetStepId: hotspot.targetStepId
          })
        );
      }
    });
  });

  return Object.freeze(diagnostics);
}
