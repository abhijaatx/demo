import type { WorkspaceRole } from "./workspace.js";

export type AuthorizationRole = WorkspaceRole | "guest";

export type WorkspaceCapability =
  | "workspace:read"
  | "workspace:create"
  | "workspace:update"
  | "workspace:delete"
  | "member:read"
  | "member:invite"
  | "member:update"
  | "member:remove"
  | "member:leave"
  | "demo:read"
  | "demo:create"
  | "demo:update"
  | "demo:delete"
  | "demo:publish"
  | "demo:share"
  | "demo:export"
  | "analytics:read";

export class AuthorizationDeniedError extends Error {
  readonly statusCode = 403 as const;

  constructor() {
    super("You do not have permission to perform this action.");
    this.name = "AuthorizationDeniedError";
  }
}

const roleCapabilities: Readonly<Record<AuthorizationRole, readonly WorkspaceCapability[]>> = {
  owner: [
    "workspace:read",
    "workspace:create",
    "workspace:update",
    "workspace:delete",
    "member:read",
    "member:invite",
    "member:update",
    "member:remove",
    "member:leave",
    "demo:read",
    "demo:create",
    "demo:update",
    "demo:delete",
    "demo:publish",
    "demo:share",
    "demo:export",
    "analytics:read"
  ],
  admin: [
    "workspace:read",
    "workspace:update",
    "member:read",
    "member:invite",
    "member:update",
    "member:remove",
    "member:leave",
    "demo:read",
    "demo:create",
    "demo:update",
    "demo:delete",
    "demo:publish",
    "demo:share",
    "demo:export",
    "analytics:read"
  ],
  editor: [
    "workspace:read",
    "member:read",
    "member:leave",
    "demo:read",
    "demo:create",
    "demo:update",
    "demo:publish",
    "demo:share",
    "demo:export",
    "analytics:read"
  ],
  viewer: ["workspace:read", "member:read", "member:leave", "demo:read", "analytics:read"],
  guest: ["demo:read"]
};

export function capabilitiesForRole(role: AuthorizationRole): readonly WorkspaceCapability[] {
  return Object.freeze([...roleCapabilities[role]]);
}

export function can(role: AuthorizationRole, capability: WorkspaceCapability): boolean {
  return roleCapabilities[role].includes(capability);
}

export function requireCapability(role: AuthorizationRole, capability: WorkspaceCapability): void {
  if (!can(role, capability)) throw new AuthorizationDeniedError();
}

export type WorkspaceAuthorizationContext = Readonly<{
  userId: string | null;
  workspaceId: string;
  role: AuthorizationRole;
}>;

export function requireWorkspaceCapability(
  context: WorkspaceAuthorizationContext,
  workspaceId: string,
  capability: WorkspaceCapability
): void {
  if (context.workspaceId !== workspaceId) throw new AuthorizationDeniedError();
  requireCapability(context.role, capability);
}
