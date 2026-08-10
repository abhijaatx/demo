/**
 * Finalize Recording Session to Demo Document — TASK-096
 */

import { createDefaultDemoDocument, type DemoDocument, type DemoStep } from "./demo-document.js";
import type { RecordingSessionState } from "./recording-session.js";

export function finalizeRecordingToDemoDocument(
  session: RecordingSessionState,
  workspaceId: string
): DemoDocument {
  if (!session.steps || session.steps.length === 0) {
    throw new Error("Cannot finalize an empty recording session.");
  }

  const baseDoc = createDefaultDemoDocument(`demo-${session.id}`);

  const steps: DemoStep[] = session.steps.map((recordedStep, idx) => {
    const click = recordedStep.clickContext;
    const hotspotId = `hotspot-${idx + 1}`;

    return Object.freeze({
      id: `step-${idx + 1}`,
      orderIndex: idx,
      title: click.pageTitle || `Step ${idx + 1}`,
      description: null,
      media: Object.freeze({
        assetId: recordedStep.screenshot.captureId,
        assetType: "screenshot" as const,
        storagePath: `/uploads/captures/${recordedStep.screenshot.captureId}.png`,
        width: recordedStep.screenshot.widthPx,
        height: recordedStep.screenshot.heightPx,
        durationSeconds: null,
        posterPath: null
      }),
      hotspots: Object.freeze([
        Object.freeze({
          id: hotspotId,
          x: click.xPercent,
          y: click.yPercent,
          width: 15,
          height: 10,
          style: Object.freeze({
            color: "#6366f1",
            shape: "rectangle",
            pulse: true,
            opacity: 1
          }),
          tooltipText: click.elementHint ? `Click ${click.elementHint}` : null,
          targetStepId: idx < session.steps.length - 1 ? `step-${idx + 2}` : null,
          actionConfig: Object.freeze({
            type: "next"
          })
        })
      ]),
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
