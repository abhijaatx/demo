/**
 * RBAC Permission Matrix & Enterprise Overrides — TASK-172
 */

export type PermissionAction = "read" | "write" | "delete" | "publish";
export type UserRole = "admin" | "creator" | "viewer" | "service_account";

const ROLE_PERMISSIONS: Record<UserRole, readonly PermissionAction[]> = {
  admin: ["read", "write", "delete", "publish"],
  creator: ["read", "write", "publish"],
  viewer: ["read"],
  service_account: ["read", "write"]
};

export function hasPermission(role: UserRole, action: PermissionAction): boolean {
  const allowedActions = ROLE_PERMISSIONS[role] || [];
  return allowedActions.includes(action);
}
