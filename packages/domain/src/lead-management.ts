/**
 * Lead Capture Management & Contact Status Engine — TASK-124
 */

export type LeadStatus = "new" | "contacted" | "qualified" | "disqualified";

export interface LeadRecord {
  readonly leadId: string;
  readonly workspaceId: string;
  readonly demoId: string;
  readonly email: string;
  readonly formId: string;
  readonly answers: Readonly<Record<string, string>>;
  readonly intentScore: number;
  readonly status: LeadStatus;
  readonly createdAtIso: string;
}

export function createLeadRecord(
  workspaceId: string,
  demoId: string,
  email: string,
  formId: string,
  answers: Record<string, string> = {},
  intentScore = 50
): LeadRecord {
  if (!email.includes("@")) {
    throw new Error("Invalid lead email address.");
  }

  return Object.freeze({
    leadId: `lead-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    workspaceId,
    demoId,
    email: email.trim().toLowerCase(),
    formId,
    answers: Object.freeze({ ...answers }),
    intentScore: Math.min(100, Math.max(0, intentScore)),
    status: "new",
    createdAtIso: new Date().toISOString()
  });
}

export function updateLeadStatus(lead: LeadRecord, status: LeadStatus): LeadRecord {
  return Object.freeze({
    ...lead,
    status
  });
}
