import { createHash, randomBytes } from "node:crypto";
import {
  AuthorizationDeniedError,
  InvitationConflictError,
  InvitationStoreError,
  InvitationValidationError,
  normalizeInvitationEmail,
  validateInvitationExpiry,
  normalizeInvitationRole,
  normalizeInvitationToken,
  normalizeUserId,
  capabilitiesForRole,
  type CreatedWorkspaceInvitation,
  type InvitationRole,
  type WorkspaceAuditEvent,
  type WorkspaceMember,
  type WorkspaceInvitation,
  type WorkspaceInvitationRepository,
  type WorkspaceRole,
  type WorkspaceSummary
} from "@supademo/domain";
import type { Pool } from "pg";
import { createUuidV7 } from "./ids.js";
import { query } from "./pool.js";
import { withTransaction } from "./transaction.js";

type InvitationRow = Readonly<{
  id: string;
  workspace_id: string;
  email: string;
  role: InvitationRole;
  expires_at: Date | string;
  created_at: Date | string;
}>;

type WorkspaceRow = Readonly<{
  organization_id: string;
  organization_name: string;
  workspace_id: string;
  workspace_name: string;
  slug: string;
  role: WorkspaceRole;
  created_at: Date | string;
}>;

type MemberRow = Readonly<{
  user_id: string;
  workspace_id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: WorkspaceRole;
  created_at: Date | string;
}>;

type AuditEventRow = Readonly<{
  id: string;
  workspace_id: string;
  action: WorkspaceAuditEvent["action"];
  actor_user_id: string;
  target_user_id: string | null;
  invitation_id: string | null;
  created_at: Date | string;
}>;

export class DatabaseMembershipRepository implements WorkspaceInvitationRepository {
  constructor(private readonly pool: Pool) {}

  async listMembers(
    actorUserIdInput: string,
    workspaceIdInput: string
  ): Promise<readonly WorkspaceMember[]> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUuid(workspaceIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceRole(client, workspaceId, actorUserId, "member:read");
        const result = await query<MemberRow>(
          client,
          `
            SELECT m.user_id, m.workspace_id, u.email, p.display_name, p.avatar_url, m.role, m.created_at
            FROM memberships m
            INNER JOIN users u ON u.id = m.user_id
            INNER JOIN user_profiles p ON p.user_id = m.user_id
            WHERE m.workspace_id = $1
            ORDER BY CASE m.role WHEN 'owner' THEN 0 WHEN 'admin' THEN 1 WHEN 'editor' THEN 2 ELSE 3 END,
              lower(p.display_name), m.user_id
          `,
          [workspaceId]
        );
        return Object.freeze(result.rows.map(mapMember));
      });
    } catch (error) {
      if (error instanceof AuthorizationDeniedError || error instanceof InvitationStoreError)
        throw error;
      throw new InvitationStoreError();
    }
  }

  async listPendingInvitations(
    actorUserIdInput: string,
    workspaceIdInput: string
  ): Promise<readonly WorkspaceInvitation[]> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUuid(workspaceIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceRole(client, workspaceId, actorUserId, "member:read");
        const result = await query<InvitationRow>(
          client,
          `
            SELECT id, workspace_id, email, role, expires_at, created_at
            FROM workspace_invitations
            WHERE workspace_id = $1 AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > now()
            ORDER BY created_at DESC
          `,
          [workspaceId]
        );
        return Object.freeze(result.rows.map(mapInvitation));
      });
    } catch (error) {
      if (error instanceof AuthorizationDeniedError || error instanceof InvitationStoreError)
        throw error;
      throw new InvitationStoreError();
    }
  }

  async listAuditEvents(
    actorUserIdInput: string,
    workspaceIdInput: string
  ): Promise<readonly WorkspaceAuditEvent[]> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUuid(workspaceIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceRole(client, workspaceId, actorUserId, "member:read");
        const result = await query<AuditEventRow>(
          client,
          `
            SELECT id, workspace_id, action, actor_user_id, target_user_id, invitation_id, created_at
            FROM workspace_audit_events
            WHERE workspace_id = $1
            ORDER BY created_at DESC
            LIMIT 100
          `,
          [workspaceId]
        );
        return Object.freeze(result.rows.map(mapAuditEvent));
      });
    } catch (error) {
      if (error instanceof AuthorizationDeniedError || error instanceof InvitationStoreError)
        throw error;
      throw new InvitationStoreError();
    }
  }

  async createInvitation(
    workspaceIdInput: string,
    inviterUserIdInput: string,
    emailInput: string,
    roleInput: InvitationRole,
    expiresAt: Date
  ): Promise<CreatedWorkspaceInvitation> {
    const workspaceId = normalizeUuid(workspaceIdInput);
    const inviterUserId = normalizeUserId(inviterUserIdInput);
    const email = normalizeInvitationEmail(emailInput);
    const role = normalizeInvitationRole(roleInput);
    const expiry = validateInvitationExpiry(expiresAt);
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceRole(client, workspaceId, inviterUserId, "member:invite");
        const result = await query<InvitationRow>(
          client,
          `
            INSERT INTO workspace_invitations
              (id, workspace_id, inviter_user_id, email, role, token_hash, expires_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, workspace_id, email, role, expires_at, created_at
          `,
          [createUuidV7(), workspaceId, inviterUserId, email, role, tokenHash, expiry]
        );
        const row = result.rows[0];
        if (!row) throw new InvitationStoreError();
        await insertAuditEvent(client, workspaceId, inviterUserId, "member.invited", null, row.id);
        return { invitation: mapInvitation(row), token };
      });
    } catch (error) {
      if (error instanceof AuthorizationDeniedError || error instanceof InvitationStoreError) {
        throw error;
      }
      throw new InvitationStoreError();
    }
  }

  async acceptInvitation(
    tokenInput: string,
    acceptingUserIdInput: string,
    acceptingEmailInput: string
  ): Promise<WorkspaceSummary | null> {
    const token = normalizeInvitationToken(tokenInput);
    const acceptingUserId = normalizeUserId(acceptingUserIdInput);
    const acceptingEmail = normalizeInvitationEmail(acceptingEmailInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        const result = await query<InvitationRow>(
          client,
          `
            SELECT id, workspace_id, email, role, expires_at, created_at
            FROM workspace_invitations
            WHERE token_hash = $1
              AND accepted_at IS NULL
              AND revoked_at IS NULL
              AND expires_at > now()
            FOR UPDATE
          `,
          [hashToken(token)]
        );
        const invitation = result.rows[0];
        if (!invitation || invitation.email !== acceptingEmail) return null;

        await query(
          client,
          `
            INSERT INTO memberships (workspace_id, user_id, role)
            VALUES ($1, $2, $3)
            ON CONFLICT (workspace_id, user_id)
            DO UPDATE SET role = EXCLUDED.role, updated_at = now()
          `,
          [invitation.workspace_id, acceptingUserId, invitation.role]
        );
        await query(
          client,
          "UPDATE workspace_invitations SET accepted_at = now(), updated_at = now() WHERE id = $1",
          [invitation.id]
        );
        return selectWorkspace(client, invitation.workspace_id, acceptingUserId);
      });
    } catch (error) {
      if (error instanceof InvitationStoreError) throw error;
      throw new InvitationStoreError();
    }
  }

  async revokeInvitation(
    actorUserIdInput: string,
    workspaceIdInput: string,
    invitationIdInput: string
  ): Promise<boolean> {
    return this.updateInvitationState(
      actorUserIdInput,
      workspaceIdInput,
      invitationIdInput,
      "revoke"
    );
  }

  async resendInvitation(
    actorUserIdInput: string,
    workspaceIdInput: string,
    invitationIdInput: string,
    expiresAt: Date
  ): Promise<CreatedWorkspaceInvitation | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUuid(workspaceIdInput);
    const invitationId = normalizeUuid(invitationIdInput);
    const expiry = validateInvitationExpiry(expiresAt);
    const token = randomBytes(32).toString("base64url");
    const tokenHash = hashToken(token);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceRole(client, workspaceId, actorUserId, "member:invite");
        const result = await query<InvitationRow>(
          client,
          `
            UPDATE workspace_invitations
            SET token_hash = $3, expires_at = $4, revoked_at = NULL, updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND accepted_at IS NULL
            RETURNING id, workspace_id, email, role, expires_at, created_at
          `,
          [invitationId, workspaceId, tokenHash, expiry]
        );
        const row = result.rows[0];
        return row ? { invitation: mapInvitation(row), token } : null;
      });
    } catch (error) {
      if (error instanceof AuthorizationDeniedError || error instanceof InvitationStoreError) {
        throw error;
      }
      throw new InvitationStoreError();
    }
  }

  async removeMember(
    actorUserIdInput: string,
    workspaceIdInput: string,
    memberUserIdInput: string
  ): Promise<boolean> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUuid(workspaceIdInput);
    const memberUserId = normalizeUserId(memberUserIdInput);
    if (actorUserId === memberUserId) throw new InvitationConflictError();
    try {
      return await withTransaction(this.pool, async (client) => {
        const actorRole = await requireWorkspaceRole(
          client,
          workspaceId,
          actorUserId,
          "member:remove"
        );
        const target = await memberRole(client, workspaceId, memberUserId);
        if (!target) return false;
        if (actorRole === "admin" && (target === "owner" || target === "admin")) {
          throw new AuthorizationDeniedError();
        }
        if (target === "owner" && (await ownerCount(client, workspaceId)) <= 1) {
          throw new InvitationConflictError();
        }
        const result = await query(
          client,
          "DELETE FROM memberships WHERE workspace_id = $1 AND user_id = $2",
          [workspaceId, memberUserId]
        );
        if (result.rowCount === 1) {
          await insertAuditEvent(
            client,
            workspaceId,
            actorUserId,
            "member.removed",
            memberUserId,
            null
          );
          return true;
        }
        return false;
      });
    } catch (error) {
      if (
        error instanceof AuthorizationDeniedError ||
        error instanceof InvitationConflictError ||
        error instanceof InvitationStoreError
      ) {
        throw error;
      }
      throw new InvitationStoreError();
    }
  }

  async updateMemberRole(
    actorUserIdInput: string,
    workspaceIdInput: string,
    memberUserIdInput: string,
    roleInput: InvitationRole
  ): Promise<WorkspaceMember | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUuid(workspaceIdInput);
    const memberUserId = normalizeUserId(memberUserIdInput);
    const role = normalizeInvitationRole(roleInput);
    if (actorUserId === memberUserId) throw new InvitationConflictError();
    try {
      return await withTransaction(this.pool, async (client) => {
        const actorRole = await requireWorkspaceRole(
          client,
          workspaceId,
          actorUserId,
          "member:update"
        );
        const targetRole = await memberRole(client, workspaceId, memberUserId);
        if (!targetRole || targetRole === "owner") return null;
        if (actorRole === "admin" && (targetRole === "admin" || role === "admin")) {
          throw new AuthorizationDeniedError();
        }
        const result = await query<MemberRow>(
          client,
          `
            UPDATE memberships m
            SET role = $3, updated_at = now()
            FROM users u, user_profiles p
            WHERE m.workspace_id = $1 AND m.user_id = $2 AND u.id = m.user_id AND p.user_id = m.user_id
            RETURNING m.user_id, m.workspace_id, u.email, p.display_name, p.avatar_url, m.role, m.created_at
          `,
          [workspaceId, memberUserId, role]
        );
        const row = result.rows[0];
        if (!row) return null;
        await insertAuditEvent(
          client,
          workspaceId,
          actorUserId,
          "member.role_changed",
          memberUserId,
          null
        );
        return mapMember(row);
      });
    } catch (error) {
      if (
        error instanceof AuthorizationDeniedError ||
        error instanceof InvitationConflictError ||
        error instanceof InvitationStoreError
      ) {
        throw error;
      }
      throw new InvitationStoreError();
    }
  }

  async leaveWorkspace(userIdInput: string, workspaceIdInput: string): Promise<boolean> {
    const userId = normalizeUserId(userIdInput);
    const workspaceId = normalizeUuid(workspaceIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        const role = await memberRole(client, workspaceId, userId);
        if (!role) return false;
        if (role === "owner" && (await ownerCount(client, workspaceId)) <= 1) {
          throw new InvitationConflictError();
        }
        const result = await query(
          client,
          "DELETE FROM memberships WHERE workspace_id = $1 AND user_id = $2",
          [workspaceId, userId]
        );
        return result.rowCount === 1;
      });
    } catch (error) {
      if (error instanceof InvitationConflictError || error instanceof InvitationStoreError) {
        throw error;
      }
      throw new InvitationStoreError();
    }
  }

  private async updateInvitationState(
    actorUserIdInput: string,
    workspaceIdInput: string,
    invitationIdInput: string,
    action: "revoke"
  ): Promise<boolean> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUuid(workspaceIdInput);
    const invitationId = normalizeUuid(invitationIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceRole(client, workspaceId, actorUserId, "member:remove");
        const result = await query(
          client,
          `
            UPDATE workspace_invitations
            SET revoked_at = now(), updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND accepted_at IS NULL AND revoked_at IS NULL
          `,
          [invitationId, workspaceId]
        );
        if (action === "revoke" && result.rowCount === 1) {
          await insertAuditEvent(
            client,
            workspaceId,
            actorUserId,
            "invitation.revoked",
            null,
            invitationId
          );
          return true;
        }
        return false;
      });
    } catch (error) {
      if (error instanceof AuthorizationDeniedError || error instanceof InvitationStoreError) {
        throw error;
      }
      throw new InvitationStoreError();
    }
  }
}

async function requireWorkspaceRole(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  userId: string,
  capability: "member:invite" | "member:read" | "member:update" | "member:remove"
): Promise<WorkspaceRole> {
  const role = await memberRole(executor, workspaceId, userId);
  if (!role || !capabilitiesForRole(role).includes(capability)) {
    throw new AuthorizationDeniedError();
  }
  return role;
}

async function memberRole(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  userId: string
): Promise<WorkspaceRole | null> {
  const result = await query<{ role: WorkspaceRole }>(
    executor,
    "SELECT role FROM memberships WHERE workspace_id = $1 AND user_id = $2",
    [workspaceId, userId]
  );
  return result.rows[0]?.role ?? null;
}

async function ownerCount(
  executor: Parameters<typeof query>[0],
  workspaceId: string
): Promise<number> {
  const result = await query<{ count: string }>(
    executor,
    "SELECT count(*)::text AS count FROM memberships WHERE workspace_id = $1 AND role = 'owner'",
    [workspaceId]
  );
  return Number(result.rows[0]?.count ?? "0");
}

async function selectWorkspace(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  userId: string
): Promise<WorkspaceSummary | null> {
  const result = await query<WorkspaceRow>(
    executor,
    `
      SELECT o.id AS organization_id, o.name AS organization_name,
        w.id AS workspace_id, w.name AS workspace_name, w.slug,
        m.role, w.created_at
      FROM memberships m
      INNER JOIN workspaces w ON w.id = m.workspace_id
      INNER JOIN organizations o ON o.id = w.organization_id
      WHERE m.workspace_id = $1 AND m.user_id = $2
      LIMIT 1
    `,
    [workspaceId, userId]
  );
  const row = result.rows[0];
  if (!row) return null;
  const createdAt = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
  if (Number.isNaN(createdAt.getTime())) throw new InvitationStoreError();
  return Object.freeze({
    organizationId: row.organization_id,
    organizationName: row.organization_name,
    workspaceId: row.workspace_id,
    workspaceName: row.workspace_name,
    slug: row.slug,
    role: row.role,
    capabilities: capabilitiesForRole(row.role),
    createdAt: createdAt.toISOString()
  });
}

function mapInvitation(row: InvitationRow): WorkspaceInvitation {
  const expiresAt = row.expires_at instanceof Date ? row.expires_at : new Date(row.expires_at);
  const createdAt = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
  if (Number.isNaN(expiresAt.getTime()) || Number.isNaN(createdAt.getTime())) {
    throw new InvitationStoreError();
  }
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspace_id,
    email: normalizeInvitationEmail(row.email),
    role: normalizeInvitationRole(row.role),
    expiresAt: expiresAt.toISOString(),
    createdAt: createdAt.toISOString()
  });
}

function mapMember(row: MemberRow): WorkspaceMember {
  const joinedAt = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
  if (Number.isNaN(joinedAt.getTime())) throw new InvitationStoreError();
  return Object.freeze({
    userId: normalizeUserId(row.user_id),
    workspaceId: normalizeUuid(row.workspace_id),
    email: normalizeInvitationEmail(row.email),
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    role: row.role,
    joinedAt: joinedAt.toISOString()
  });
}

function mapAuditEvent(row: AuditEventRow): WorkspaceAuditEvent {
  const createdAt = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
  if (Number.isNaN(createdAt.getTime())) throw new InvitationStoreError();
  return Object.freeze({
    id: normalizeUuid(row.id),
    workspaceId: normalizeUuid(row.workspace_id),
    action: row.action,
    actorUserId: normalizeUserId(row.actor_user_id),
    targetUserId: row.target_user_id ? normalizeUserId(row.target_user_id) : null,
    invitationId: row.invitation_id ? normalizeUuid(row.invitation_id) : null,
    createdAt: createdAt.toISOString()
  });
}

async function insertAuditEvent(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  actorUserId: string,
  action: WorkspaceAuditEvent["action"],
  targetUserId: string | null,
  invitationId: string | null
): Promise<void> {
  await query(
    executor,
    `
      INSERT INTO workspace_audit_events
        (id, workspace_id, actor_user_id, target_user_id, invitation_id, action)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [createUuidV7(), workspaceId, actorUserId, targetUserId, invitationId, action]
  );
}

function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function normalizeUuid(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)) {
    throw new InvitationValidationError("The identifier is invalid.");
  }
  return value.toLowerCase();
}
