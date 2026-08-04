/**
 * HubSpot CRM Contact Payload Formatter & Engagement Sync — TASK-129
 */

import type { LeadRecord } from "./lead-management.js";

export interface HubSpotContactPayload {
  readonly properties: Readonly<Record<string, string>>;
}

export function formatHubSpotContactPayload(lead: LeadRecord): HubSpotContactPayload {
  const properties: Record<string, string> = {
    email: lead.email,
    supademo_intent_score: String(lead.intentScore),
    supademo_last_demo_id: lead.demoId,
    supademo_lead_status: lead.status
  };

  // Map custom form answers if present
  Object.entries(lead.answers).forEach(([k, v]) => {
    if (v && typeof v === "string") {
      properties[`supademo_form_${k}`] = v;
    }
  });

  return Object.freeze({
    properties: Object.freeze(properties)
  });
}
