import type { DemoStep } from "./demo-document.js";

function generateId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `step-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function reorderSteps(
  steps: readonly DemoStep[],
  fromIndex: number,
  toIndex: number
): readonly DemoStep[] {
  if (
    fromIndex < 0 ||
    fromIndex >= steps.length ||
    toIndex < 0 ||
    toIndex >= steps.length ||
    fromIndex === toIndex
  ) {
    return steps;
  }

  const copy = [...steps];
  const [moved] = copy.splice(fromIndex, 1);
  if (!moved) return steps;
  copy.splice(toIndex, 0, moved);

  return Object.freeze(
    copy.map((step, idx) =>
      Object.freeze({
        ...step,
        orderIndex: idx
      })
    )
  );
}

export function duplicateStep(step: DemoStep, targetOrderIndex?: number): DemoStep {
  const newId = generateId();
  return Object.freeze({
    ...step,
    id: newId,
    orderIndex: targetOrderIndex ?? step.orderIndex + 1,
    title: `${step.title} (Copy)`,
    hotspots: Object.freeze(
      step.hotspots.map((h) =>
        Object.freeze({
          ...h,
          id: generateId()
        })
      )
    ),
    callouts: Object.freeze(
      step.callouts.map((c) =>
        Object.freeze({
          ...c,
          id: generateId(),
          stepId: newId
        })
      )
    )
  });
}

export function deleteSteps(
  steps: readonly DemoStep[],
  stepIdsToDelete: ReadonlySet<string>
): readonly DemoStep[] {
  const remaining = steps.filter((s) => !stepIdsToDelete.has(s.id));
  return Object.freeze(
    remaining.map((step, idx) =>
      Object.freeze({
        ...step,
        orderIndex: idx
      })
    )
  );
}

export type BulkActionImpact = Readonly<{
  affectedStepCount: number;
  affectedHotspotCount: number;
  affectedCalloutCount: number;
  description: string;
}>;

export function previewBulkAssetReplacementImpact(
  steps: readonly DemoStep[],
  targetAssetId: string,
  newAssetId: string
): BulkActionImpact {
  let affectedStepCount = 0;
  for (const step of steps) {
    if (step.media?.assetId === targetAssetId) {
      affectedStepCount++;
    }
  }

  return Object.freeze({
    affectedStepCount,
    affectedHotspotCount: 0,
    affectedCalloutCount: 0,
    description: `Replace asset ${targetAssetId} with ${newAssetId} across ${affectedStepCount} step(s).`
  });
}

export function applyBulkAssetReplacement(
  steps: readonly DemoStep[],
  targetAssetId: string,
  newMedia: NonNullable<DemoStep["media"]>
): readonly DemoStep[] {
  return Object.freeze(
    steps.map((step) => {
      if (step.media?.assetId !== targetAssetId) return step;
      return Object.freeze({
        ...step,
        media: newMedia
      });
    })
  );
}
