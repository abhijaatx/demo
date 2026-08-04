/**
 * Multi-Workspace Organization Administration & Cross-Workspace RBAC — TASK-171
 */

export interface OrganizationRecord {
  readonly orgId: string;
  readonly orgName: string;
  readonly workspaceIds: readonly string[];
  readonly orgAdminUserIds: readonly string[];
}

export function createOrganizationRecord(
  orgId: string,
  orgName: string,
  initialAdminUserId: string
): OrganizationRecord {
  if (!orgId.trim() || !orgName.trim() || !initialAdminUserId.trim()) {
    throw new Error("Org ID, org name, and initial admin user ID are required.");
  }

  return Object.freeze({
    orgId: orgId.trim(),
    orgName: orgName.trim(),
    workspaceIds: Object.freeze([]),
    orgAdminUserIds: Object.freeze([initialAdminUserId.trim()])
  });
}

export function addWorkspaceToOrganization(
  org: OrganizationRecord,
  workspaceId: string,
  requesterUserId: string
): OrganizationRecord {
  if (!org.orgAdminUserIds.includes(requesterUserId)) {
    throw new Error("Only organization admins can manage workspace assignments.");
  }

  if (org.workspaceIds.includes(workspaceId)) {
    return org;
  }

  return Object.freeze({
    ...org,
    workspaceIds: Object.freeze([...org.workspaceIds, workspaceId])
  });
}
