/**
 * Custom Domain Ownership Verification & Routing Engine — TASK-158
 */

export type CustomDomainStatus = "pending_verification" | "active" | "failed";

export interface CustomDomainRecord {
  readonly domainId: string;
  readonly workspaceId: string;
  readonly hostname: string;
  readonly verificationTxtRecord: string;
  readonly status: CustomDomainStatus;
}

export function createCustomDomainRequest(
  domainId: string,
  workspaceId: string,
  hostname: string
): CustomDomainRecord {
  const cleanHost = hostname.trim().toLowerCase();
  if (!cleanHost || !cleanHost.includes(".")) {
    throw new Error("Invalid custom domain hostname.");
  }

  const token = Math.random().toString(36).slice(2, 12);
  const verificationTxtRecord = `supademo-verify=${token}`;

  return Object.freeze({
    domainId: domainId.trim(),
    workspaceId: workspaceId.trim(),
    hostname: cleanHost,
    verificationTxtRecord,
    status: "pending_verification"
  });
}

export function verifyCustomDomainOwnership(
  record: CustomDomainRecord,
  resolvedTxtValue: string
): CustomDomainRecord {
  const isMatch = resolvedTxtValue.trim() === record.verificationTxtRecord;

  return Object.freeze({
    ...record,
    status: isMatch ? "active" : "failed"
  });
}
