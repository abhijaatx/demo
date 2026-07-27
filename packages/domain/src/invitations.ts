import type { WorkspaceRole, WorkspaceSummary } from "./workspace.js";

export type InvitationRole = "admin" | "editor" | "viewer";

export type WorkspaceInvitation = Readonly<{
  id: string;
  workspaceId: string;
  email: string;
  role: InvitationRole;
  expiresAt: string;
  createdAt: string;
}>;

export type CreatedWorkspaceInvitation = Readonly<{
  invitation: WorkspaceInvitation;
  token: string;
}>;

export type WorkspaceMember = Readonly<{
  userId: string;
  workspaceId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  role: WorkspaceRole;
  joinedAt: string;
}>;

export type WorkspaceAuditEvent = Readonly<{
  id: string;
  workspaceId: string;
  action: "member.invited" | "member.role_changed" | "member.removed" | "invitation.revoked";
  actorUserId: string;
  targetUserId: string | null;
  invitationId: string | null;
  createdAt: string;
}>;

export class InvitationValidationError extends Error {
  readonly field: string | undefined;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "InvitationValidationError";
    this.field = field;
  }
}

export class InvitationConflictError extends Error {
  constructor() {
    super("The invitation could not be completed.");
    this.name = "InvitationConflictError";
  }
}

export class InvitationStoreError extends Error {
  constructor() {
    super("The invitation could not be completed.");
    this.name = "InvitationStoreError";
  }
}

export interface WorkspaceInvitationRepository {
  listMembers(actorUserId: string, workspaceId: string): Promise<readonly WorkspaceMember[]>;
  listPendingInvitations(
    actorUserId: string,
    workspaceId: string
  ): Promise<readonly WorkspaceInvitation[]>;
  listAuditEvents(
    actorUserId: string,
    workspaceId: string
  ): Promise<readonly WorkspaceAuditEvent[]>;
  createInvitation(
    workspaceId: string,
    inviterUserId: string,
    email: string,
    role: InvitationRole,
    expiresAt: Date
  ): Promise<CreatedWorkspaceInvitation>;
  acceptInvitation(
    token: string,
    acceptingUserId: string,
    acceptingEmail: string
  ): Promise<WorkspaceSummary | null>;
  revokeInvitation(
    actorUserId: string,
    workspaceId: string,
    invitationId: string
  ): Promise<boolean>;
  resendInvitation(
    actorUserId: string,
    workspaceId: string,
    invitationId: string,
    expiresAt: Date
  ): Promise<CreatedWorkspaceInvitation | null>;
  removeMember(actorUserId: string, workspaceId: string, memberUserId: string): Promise<boolean>;
  updateMemberRole(
    actorUserId: string,
    workspaceId: string,
    memberUserId: string,
    role: InvitationRole
  ): Promise<WorkspaceMember | null>;
  leaveWorkspace(userId: string, workspaceId: string): Promise<boolean>;
}

export interface InvitationDelivery {
  sendInvitation(
    input: Readonly<{
      email: string;
      workspaceName: string;
      token: string;
      expiresAt: string;
    }>
  ): Promise<void>;
}

export function normalizeInvitationEmail(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvitationValidationError("Enter a valid email address.", "email");
  }
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new InvitationValidationError("Enter a valid email address.", "email");
  }
  return email;
}

export function normalizeInvitationRole(value: unknown): InvitationRole {
  if (value !== "admin" && value !== "editor" && value !== "viewer") {
    throw new InvitationValidationError("Choose an allowed workspace role.", "role");
  }
  return value;
}

export function normalizeInvitationToken(value: unknown): string {
  if (typeof value !== "string") {
    throw new InvitationValidationError("The invitation token is invalid.", "token");
  }
  const token = value.trim();
  if (token.length < 32 || token.length > 256 || !/^[A-Za-z0-9_-]+$/u.test(token)) {
    throw new InvitationValidationError("The invitation token is invalid.", "token");
  }
  return token;
}

export function invitationExpiry(now = Date.now(), days = 7): Date {
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    throw new InvitationValidationError("The invitation expiry is invalid.");
  }
  return new Date(now + days * 24 * 60 * 60 * 1_000);
}

export function validateInvitationExpiry(value: Date, now = Date.now()): Date {
  const timestamp = value instanceof Date ? value.getTime() : Number.NaN;
  const maximum = now + 30 * 24 * 60 * 60 * 1_000;
  if (!Number.isFinite(timestamp) || timestamp <= now || timestamp > maximum) {
    throw new InvitationValidationError("The invitation expiry is invalid.");
  }
  return new Date(timestamp);
}
