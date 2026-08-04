/**
 * Enterprise Security Administration & Posture Overview — TASK-179
 */

export interface EnterpriseSecurityOverview {
  readonly workspaceId: string;
  readonly isSsoEnforced: boolean;
  readonly activeApiKeysCount: number;
  readonly customDomainsCount: number;
  readonly retentionPolicySummary: string;
}

export function createEnterpriseSecurityOverview(
  workspaceId: string,
  isSsoEnforced = false,
  activeApiKeysCount = 0,
  customDomainsCount = 0
): EnterpriseSecurityOverview {
  if (!workspaceId.trim()) {
    throw new Error("Workspace ID is required for security administration overview.");
  }

  return Object.freeze({
    workspaceId: workspaceId.trim(),
    isSsoEnforced,
    activeApiKeysCount,
    customDomainsCount,
    retentionPolicySummary: "Standard 365-day retention active"
  });
}
