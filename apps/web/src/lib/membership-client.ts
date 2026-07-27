import { apiBaseUrl } from "./api-client";
import { readCsrfToken } from "./csrf";

export type MemberRole = "owner" | "admin" | "editor" | "viewer";
export type AssignableMemberRole = Exclude<MemberRole, "owner">;

export type WorkspaceMember = Readonly<{
  userId: string;
  workspaceId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: MemberRole;
  joinedAt: string;
}>;

export type PendingInvitation = Readonly<{
  id: string;
  workspaceId: string;
  email: string;
  role: AssignableMemberRole;
  expiresAt: string;
  createdAt: string;
}>;

export type MembershipAuditEvent = Readonly<{
  id: string;
  workspaceId: string;
  action: string;
  actorUserId: string;
  targetUserId: string | null;
  invitationId: string | null;
  createdAt: string;
}>;

export class MembershipClientError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(
      status === 401
        ? "Sign in to manage workspace members."
        : status === 403
          ? "You don’t have permission to manage members in this workspace."
          : "Workspace members could not be updated. Try again."
    );
    this.name = "MembershipClientError";
    this.status = status;
  }
}

export interface MembershipClient {
  listMembers(workspaceId: string): Promise<readonly WorkspaceMember[]>;
  listPendingInvitations(workspaceId: string): Promise<readonly PendingInvitation[]>;
  listAuditEvents(workspaceId: string): Promise<readonly MembershipAuditEvent[]>;
  invite(workspaceId: string, email: string, role: AssignableMemberRole): Promise<void>;
  updateRole(
    workspaceId: string,
    memberId: string,
    role: AssignableMemberRole
  ): Promise<WorkspaceMember>;
  remove(workspaceId: string, memberId: string): Promise<void>;
  revokeInvitation(workspaceId: string, invitationId: string): Promise<void>;
  resendInvitation(workspaceId: string, invitationId: string): Promise<void>;
}

export function createMembershipClient(fetcher: typeof fetch = fetch): MembershipClient {
  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetcher(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.method && init.method !== "GET" && readCsrfToken()
          ? { "X-CSRF-Token": readCsrfToken() }
          : {}),
        ...init.headers
      }
    });
    if (!response.ok) throw new MembershipClientError(response.status);
    if (response.status === 202 || response.status === 204) return undefined as T;
    return (await response.json()) as T;
  };

  return {
    async listMembers(workspaceId) {
      const value: unknown = await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/members`
      );
      if (!Array.isArray(value) || !value.every(isWorkspaceMember))
        throw new MembershipClientError(502);
      return value;
    },
    async listPendingInvitations(workspaceId) {
      const value: unknown = await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/invitations/pending`
      );
      if (!Array.isArray(value) || !value.every(isPendingInvitation)) {
        throw new MembershipClientError(502);
      }
      return value;
    },
    async listAuditEvents(workspaceId) {
      const value: unknown = await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/audit-events`
      );
      if (!Array.isArray(value) || !value.every(isMembershipAuditEvent)) {
        throw new MembershipClientError(502);
      }
      return value;
    },
    async invite(workspaceId, email, role) {
      await request(`/workspaces/${encodeURIComponent(workspaceId)}/invitations`, {
        method: "POST",
        body: JSON.stringify({ email, role })
      });
    },
    async updateRole(workspaceId, memberId, role) {
      const value: unknown = await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(memberId)}`,
        { method: "PATCH", body: JSON.stringify({ role }) }
      );
      if (!isWorkspaceMember(value)) throw new MembershipClientError(502);
      return value;
    },
    async remove(workspaceId, memberId) {
      await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/members/${encodeURIComponent(memberId)}`,
        { method: "DELETE" }
      );
    },
    async revokeInvitation(workspaceId, invitationId) {
      await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/invitations/${encodeURIComponent(invitationId)}/revoke`,
        { method: "POST", body: JSON.stringify({}) }
      );
    },
    async resendInvitation(workspaceId, invitationId) {
      await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/invitations/${encodeURIComponent(invitationId)}/resend`,
        { method: "POST", body: JSON.stringify({}) }
      );
    }
  };
}

function isWorkspaceMember(value: unknown): value is WorkspaceMember {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const member = value as Record<string, unknown>;
  return (
    typeof member["userId"] === "string" &&
    typeof member["workspaceId"] === "string" &&
    typeof member["email"] === "string" &&
    typeof member["displayName"] === "string" &&
    (member["avatarUrl"] === null || typeof member["avatarUrl"] === "string") &&
    isMemberRole(member["role"]) &&
    typeof member["joinedAt"] === "string"
  );
}

function isPendingInvitation(value: unknown): value is PendingInvitation {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const invitation = value as Record<string, unknown>;
  return (
    typeof invitation["id"] === "string" &&
    typeof invitation["workspaceId"] === "string" &&
    typeof invitation["email"] === "string" &&
    isAssignableRole(invitation["role"]) &&
    typeof invitation["expiresAt"] === "string" &&
    typeof invitation["createdAt"] === "string"
  );
}

function isMembershipAuditEvent(value: unknown): value is MembershipAuditEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  return (
    typeof event["id"] === "string" &&
    typeof event["workspaceId"] === "string" &&
    typeof event["action"] === "string" &&
    typeof event["actorUserId"] === "string" &&
    (event["targetUserId"] === null || typeof event["targetUserId"] === "string") &&
    (event["invitationId"] === null || typeof event["invitationId"] === "string") &&
    typeof event["createdAt"] === "string"
  );
}

function isMemberRole(value: unknown): value is MemberRole {
  return value === "owner" || value === "admin" || value === "editor" || value === "viewer";
}

function isAssignableRole(value: unknown): value is AssignableMemberRole {
  return value === "admin" || value === "editor" || value === "viewer";
}
