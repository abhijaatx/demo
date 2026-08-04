/**
 * Data Residency Regions & Tenant Placement Controls — TASK-176
 */

export type ResidencyRegion = "us-east-1" | "eu-central-1" | "ap-southeast-1";

export interface TenantResidencyRecord {
  readonly workspaceId: string;
  readonly region: ResidencyRegion;
  readonly isVerifiedInfrastructure: boolean;
}

export function createTenantResidencyRecord(
  workspaceId: string,
  region: ResidencyRegion = "us-east-1"
): TenantResidencyRecord {
  if (!workspaceId.trim()) {
    throw new Error("Workspace ID is required for data residency placement.");
  }

  return Object.freeze({
    workspaceId: workspaceId.trim(),
    region,
    isVerifiedInfrastructure: false // Production regional activation requires AWS verification
  });
}
