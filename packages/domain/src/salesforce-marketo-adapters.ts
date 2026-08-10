/**
 * Salesforce & Marketo Adapter Payload Formatters — TASK-130
 */

import type { LeadRecord } from "./lead-management.js";

export function formatSalesforceLeadPayload(lead: LeadRecord): Record<string, unknown> {
  return Object.freeze({
    Email: lead.email,
    LastName: lead.email.split("@")[0] || "Lead",
    Company: (lead.answers["company"] as string) || "Unknown",
    Description: `Captured from Supademo Demo ID: ${lead.demoId}`,
    Rating: lead.intentScore >= 80 ? "Hot" : lead.intentScore >= 50 ? "Warm" : "Cold"
  });
}

export function formatMarketoLeadPayload(lead: LeadRecord): Record<string, unknown> {
  return Object.freeze({
    lookupField: "email",
    input: Object.freeze([
      Object.freeze({
        email: lead.email,
        supademoIntentScore: lead.intentScore,
        supademoLastDemoId: lead.demoId
      })
    ])
  });
}
