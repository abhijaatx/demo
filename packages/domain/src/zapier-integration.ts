/**
 * Zapier Trigger Subscriptions & Sample Data Payloads — TASK-127
 */

import { validateWebhookUrl } from "./webhook-infrastructure.js";

export type ZapierEventKind = "lead.created" | "demo.viewed";

export interface ZapierSubscription {
  readonly subscriptionId: string;
  readonly targetUrl: string;
  readonly eventKind: ZapierEventKind;
  readonly createdAtIso: string;
}

export function createZapierSubscription(
  targetUrl: string,
  eventKind: ZapierEventKind = "lead.created"
): ZapierSubscription {
  if (!validateWebhookUrl(targetUrl)) {
    throw new Error("Invalid or unsafe Zapier target URL.");
  }

  return Object.freeze({
    subscriptionId: `zap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    targetUrl,
    eventKind,
    createdAtIso: new Date().toISOString()
  });
}

export function formatZapierLeadSampleData(): Record<string, unknown> {
  return Object.freeze({
    id: "lead-sample-1",
    email: "alex@example.com",
    demoTitle: "Sample Product Walkthrough",
    intentScore: 85,
    createdAt: new Date().toISOString()
  });
}
