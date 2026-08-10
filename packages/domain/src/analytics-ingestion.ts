/**
 * Public Batched Analytics Ingestion & Validation Engine — TASK-113
 */

import type { AnalyticsEvent } from "./analytics-contract.js";

export interface BatchedAnalyticsIngestionPayload {
  readonly sessionId: string;
  readonly events: readonly AnalyticsEvent[];
}

export interface IngestionResult {
  readonly acceptedCount: number;
  readonly rejectedCount: number;
  readonly status: "accepted" | "partial" | "rejected";
}

export function processBatchedAnalyticsIngestion(
  payload: BatchedAnalyticsIngestionPayload,
  maxBatchSize = 50
): IngestionResult {
  if (!payload.events || payload.events.length === 0) {
    return Object.freeze({ acceptedCount: 0, rejectedCount: 0, status: "accepted" });
  }

  if (payload.events.length > maxBatchSize) {
    return Object.freeze({
      acceptedCount: 0,
      rejectedCount: payload.events.length,
      status: "rejected"
    });
  }

  let accepted = 0;
  let rejected = 0;

  payload.events.forEach((evt) => {
    if (evt && evt.v === 1 && evt.demoId && evt.kind) {
      accepted++;
    } else {
      rejected++;
    }
  });

  const status = rejected === 0 ? "accepted" : accepted > 0 ? "partial" : "rejected";
  return Object.freeze({ acceptedCount: accepted, rejectedCount: rejected, status });
}
