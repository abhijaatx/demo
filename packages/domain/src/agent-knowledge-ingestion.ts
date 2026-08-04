/**
 * AI Agent Knowledge Source Ingestion & SSRF Protection — TASK-161
 */

import { validateWebhookUrl } from "./webhook-infrastructure.js";

export type KnowledgeSourceType = "file" | "url" | "integration";

export interface KnowledgeSourceRecord {
  readonly sourceId: string;
  readonly agentId: string;
  readonly workspaceId: string;
  readonly sourceType: KnowledgeSourceType;
  readonly contentUrlOrPath: string;
  readonly status: "pending" | "indexed" | "failed";
}

export function createKnowledgeSourceRecord(
  sourceId: string,
  agentId: string,
  workspaceId: string,
  sourceType: KnowledgeSourceType,
  target: string
): KnowledgeSourceRecord {
  if (!sourceId.trim() || !agentId.trim() || !workspaceId.trim() || !target.trim()) {
    throw new Error("Source ID, agent ID, workspace ID, and target are required.");
  }

  if (sourceType === "url") {
    const isValidUrl = validateWebhookUrl(target);
    if (!isValidUrl) {
      throw new Error(`SSRF blocked knowledge source URL: ${target}`);
    }
  }

  return Object.freeze({
    sourceId: sourceId.trim(),
    agentId: agentId.trim(),
    workspaceId: workspaceId.trim(),
    sourceType,
    contentUrlOrPath: target.trim(),
    status: "pending"
  });
}
