/**
 * Plans, Entitlements, Seat Controls & Usage Quotas — TASK-178
 */

export type PlanTier = "free" | "pro" | "enterprise";

export interface WorkspaceEntitlement {
  readonly workspaceId: string;
  readonly planTier: PlanTier;
  readonly maxCreatorSeats: number;
  readonly maxDemos: number;
}

export function createWorkspaceEntitlement(
  workspaceId: string,
  planTier: PlanTier = "free"
): WorkspaceEntitlement {
  if (!workspaceId.trim()) {
    throw new Error("Workspace ID is required for entitlement.");
  }

  const limits: Record<PlanTier, { maxCreatorSeats: number; maxDemos: number }> = {
    free: { maxCreatorSeats: 1, maxDemos: 5 },
    pro: { maxCreatorSeats: 5, maxDemos: 50 },
    enterprise: { maxCreatorSeats: 100, maxDemos: 10000 }
  };

  const limit = limits[planTier];

  return Object.freeze({
    workspaceId: workspaceId.trim(),
    planTier,
    maxCreatorSeats: limit.maxCreatorSeats,
    maxDemos: limit.maxDemos
  });
}
