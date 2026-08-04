/**
 * Configurable Data Retention & Legal Hold Policy — TASK-175
 */

export interface DataRetentionPolicy {
  readonly policyId: string;
  readonly workspaceId: string;
  readonly analyticsRetentionDays: number;
  readonly auditLogRetentionDays: number;
  readonly hasLegalHold: boolean;
}

export function createDataRetentionPolicy(
  policyId: string,
  workspaceId: string,
  analyticsRetentionDays = 365,
  auditLogRetentionDays = 730
): DataRetentionPolicy {
  if (!policyId.trim() || !workspaceId.trim()) {
    throw new Error("Policy ID and workspace ID are required.");
  }
  if (analyticsRetentionDays < 30 || auditLogRetentionDays < 90) {
    throw new Error("Retention policy must satisfy legal minimum retention periods.");
  }

  return Object.freeze({
    policyId: policyId.trim(),
    workspaceId: workspaceId.trim(),
    analyticsRetentionDays,
    auditLogRetentionDays,
    hasLegalHold: false
  });
}
