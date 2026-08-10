/**
 * Shared CRM & Marketing Automation Platform (MAP) Integration Framework — TASK-128
 */

import type { LeadRecord } from "./lead-management.js";

export type CrmProvider = "hubspot" | "salesforce" | "marketo";

export interface CrmSyncConfig {
  readonly provider: CrmProvider;
  readonly accessTokenEncrypted: string;
  readonly refreshTokenEncrypted: string;
  readonly expiresAtMs: number;
  readonly fieldMappings: Readonly<Record<string, string>>;
  readonly isConnected: boolean;
}

export function createCrmSyncConfig(
  provider: CrmProvider,
  accessTokenEncrypted: string,
  refreshTokenEncrypted: string,
  expiresAtMs: number,
  fieldMappings: Record<string, string> = { email: "email", intentScore: "supademo_intent_score" }
): CrmSyncConfig {
  if (!accessTokenEncrypted.trim()) {
    throw new Error("CRM access token must be non-empty.");
  }

  return Object.freeze({
    provider,
    accessTokenEncrypted,
    refreshTokenEncrypted,
    expiresAtMs,
    fieldMappings: Object.freeze({ ...fieldMappings }),
    isConnected: true
  });
}

export function mapLeadToCrmFields(
  lead: LeadRecord,
  fieldMappings: Readonly<Record<string, string>>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  const leadData: Record<string, unknown> = {
    email: lead.email,
    intentScore: lead.intentScore,
    status: lead.status,
    demoId: lead.demoId,
    formId: lead.formId,
    ...lead.answers
  };

  Object.entries(fieldMappings).forEach(([internalKey, crmTargetField]) => {
    if (leadData[internalKey] !== undefined) {
      result[crmTargetField] = leadData[internalKey];
    }
  });

  return Object.freeze(result);
}
