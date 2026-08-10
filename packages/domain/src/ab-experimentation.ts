/**
 * Deterministic A/B Experiment Variant Assignment — TASK-120
 */

import { createHash } from "node:crypto";

export type ExperimentVariant = "control" | "treatment";

export interface AbExperimentConfig {
  readonly experimentId: string;
  readonly controlDemoId: string;
  readonly treatmentDemoId: string;
  readonly trafficSplitPercent: number; // 0 to 100
  readonly isActive: boolean;
}

export function assignExperimentVariant(
  sessionId: string,
  config: AbExperimentConfig
): { variant: ExperimentVariant; selectedDemoId: string } {
  if (!config.isActive) {
    return { variant: "control", selectedDemoId: config.controlDemoId };
  }

  // Deterministic assignment using sha256 hash bucket
  const hashHex = createHash("sha256").update(`${config.experimentId}:${sessionId}`).digest("hex");
  const bucketValue = parseInt(hashHex.slice(0, 8), 16) % 100;

  const isTreatment = bucketValue < config.trafficSplitPercent;
  const variant: ExperimentVariant = isTreatment ? "treatment" : "control";
  const selectedDemoId = isTreatment ? config.treatmentDemoId : config.controlDemoId;

  return { variant, selectedDemoId };
}
