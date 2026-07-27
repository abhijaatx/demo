import {
  capabilitiesForRole,
  normalizeIdempotencyKey,
  normalizeUserId,
  parseCreateWorkspaceInput,
  workspaceFingerprint,
  WorkspaceConflictError,
  WorkspaceStoreError,
  type CreateWorkspaceInput,
  type WorkspaceRepository,
  type WorkspaceRole,
  type WorkspaceSummary
} from "@supademo/domain";
import type { Pool } from "pg";
import { createUuidV7 } from "./ids.js";
import { query } from "./pool.js";
import { withTransaction } from "./transaction.js";

type WorkspaceRow = Readonly<{
  organization_id: string;
  organization_name: string;
  workspace_id: string;
  workspace_name: string;
  slug: string;
  role: string;
  created_at: Date | string;
}>;

export class DatabaseWorkspaceRepository implements WorkspaceRepository {
  constructor(private readonly pool: Pool) {}

  async createForUser(
    userIdInput: string,
    inputValue: CreateWorkspaceInput,
    idempotencyKeyInput: string
  ): Promise<WorkspaceSummary> {
    const userId = normalizeUserId(userIdInput);
    const input = parseCreateWorkspaceInput(inputValue);
    const idempotencyKey = normalizeIdempotencyKey(idempotencyKeyInput);
    const fingerprint = workspaceFingerprint(input);

    try {
      return await withTransaction(this.pool, async (client) => {
        const ownerResult = await query<{ id: string }>(
          client,
          "SELECT id FROM users WHERE id = $1 FOR SHARE",
          [userId]
        );
        if (!ownerResult.rows[0]) throw new WorkspaceStoreError();

        const requestResult = await query<{ owner_user_id: string }>(
          client,
          `
            INSERT INTO workspace_creation_requests
              (owner_user_id, idempotency_key, request_fingerprint)
            VALUES ($1, $2, $3)
            ON CONFLICT (owner_user_id, idempotency_key) DO NOTHING
            RETURNING owner_user_id
          `,
          [userId, idempotencyKey, fingerprint]
        );
        if (!requestResult.rows[0]) {
          const existingResult = await query<{
            request_fingerprint: string;
            organization_id: string | null;
            workspace_id: string | null;
          }>(
            client,
            `
              SELECT request_fingerprint, organization_id, workspace_id
              FROM workspace_creation_requests
              WHERE owner_user_id = $1 AND idempotency_key = $2
              FOR UPDATE
            `,
            [userId, idempotencyKey]
          );
          const existing = existingResult.rows[0];
          if (!existing || existing.request_fingerprint !== fingerprint) {
            throw new WorkspaceConflictError();
          }
          if (!existing.workspace_id) throw new WorkspaceStoreError();
          const replay = await selectWorkspace(client, existing.workspace_id, userId);
          if (!replay) throw new WorkspaceStoreError();
          return replay;
        }

        const organizationId = createUuidV7();
        await query(
          client,
          `
            INSERT INTO organizations (id, owner_user_id, name)
            VALUES ($1, $2, $3)
          `,
          [organizationId, userId, input.organizationName]
        );

        const workspaceId = createUuidV7();
        try {
          await query(
            client,
            `
              INSERT INTO workspaces (id, organization_id, name, slug)
              VALUES ($1, $2, $3, $4)
            `,
            [workspaceId, organizationId, input.workspaceName, input.slug]
          );
        } catch {
          throw new WorkspaceConflictError();
        }

        await query(
          client,
          `
            INSERT INTO memberships (workspace_id, user_id, role)
            VALUES ($1, $2, 'owner')
          `,
          [workspaceId, userId]
        );
        await query(
          client,
          `
            UPDATE workspace_creation_requests
            SET organization_id = $3, workspace_id = $4
            WHERE owner_user_id = $1 AND idempotency_key = $2
          `,
          [userId, idempotencyKey, organizationId, workspaceId]
        );
        const created = await selectWorkspace(client, workspaceId, userId);
        if (!created) throw new WorkspaceStoreError();
        return created;
      });
    } catch (error) {
      if (error instanceof WorkspaceConflictError || error instanceof WorkspaceStoreError) {
        throw error;
      }
      throw new WorkspaceStoreError();
    }
  }

  async listForUser(userIdInput: string): Promise<readonly WorkspaceSummary[]> {
    const userId = normalizeUserId(userIdInput);
    try {
      const result = await query<WorkspaceRow>(
        this.pool,
        `
          SELECT
            o.id AS organization_id,
            o.name AS organization_name,
            w.id AS workspace_id,
            w.name AS workspace_name,
            w.slug,
            m.role,
            w.created_at
          FROM memberships m
          INNER JOIN workspaces w ON w.id = m.workspace_id
          INNER JOIN organizations o ON o.id = w.organization_id
          WHERE m.user_id = $1
          ORDER BY w.created_at ASC, w.id ASC
        `,
        [userId]
      );
      return Object.freeze(result.rows.map(mapWorkspaceRow));
    } catch (error) {
      if (error instanceof WorkspaceStoreError) throw error;
      throw new WorkspaceStoreError();
    }
  }

  async getCurrentForUser(userIdInput: string): Promise<WorkspaceSummary | null> {
    const userId = normalizeUserId(userIdInput);
    try {
      const result = await query<{ current_workspace_id: string | null }>(
        this.pool,
        "SELECT current_workspace_id FROM user_profiles WHERE user_id = $1",
        [userId]
      );
      const currentWorkspaceId = result.rows[0]?.current_workspace_id;
      return currentWorkspaceId
        ? await selectWorkspace(this.pool, currentWorkspaceId, userId)
        : null;
    } catch (error) {
      if (error instanceof WorkspaceStoreError) throw error;
      throw new WorkspaceStoreError();
    }
  }

  async setCurrentForUser(
    userIdInput: string,
    workspaceIdInput: string
  ): Promise<WorkspaceSummary | null> {
    const userId = normalizeUserId(userIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    try {
      const result = await query<{ current_workspace_id: string }>(
        this.pool,
        `
          UPDATE user_profiles p
          SET current_workspace_id = $2, updated_at = now()
          WHERE p.user_id = $1
            AND EXISTS (
              SELECT 1 FROM memberships m
              WHERE m.user_id = $1 AND m.workspace_id = $2
            )
          RETURNING current_workspace_id
        `,
        [userId, workspaceId]
      );
      if (!result.rows[0]) return null;
      return await selectWorkspace(this.pool, workspaceId, userId);
    } catch (error) {
      if (error instanceof WorkspaceStoreError) throw error;
      throw new WorkspaceStoreError();
    }
  }
}

async function selectWorkspace(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  userId: string
): Promise<WorkspaceSummary | null> {
  const result = await query<WorkspaceRow>(
    executor,
    `
      SELECT
        o.id AS organization_id,
        o.name AS organization_name,
        w.id AS workspace_id,
        w.name AS workspace_name,
        w.slug,
        m.role,
        w.created_at
      FROM memberships m
      INNER JOIN workspaces w ON w.id = m.workspace_id
      INNER JOIN organizations o ON o.id = w.organization_id
      WHERE m.user_id = $1 AND w.id = $2
      LIMIT 1
    `,
    [userId, workspaceId]
  );
  const row = result.rows[0];
  return row ? mapWorkspaceRow(row) : null;
}

function mapWorkspaceRow(row: WorkspaceRow): WorkspaceSummary {
  if (
    typeof row.organization_id !== "string" ||
    typeof row.organization_name !== "string" ||
    typeof row.workspace_id !== "string" ||
    typeof row.workspace_name !== "string" ||
    typeof row.slug !== "string" ||
    !isWorkspaceRole(row.role)
  ) {
    throw new WorkspaceStoreError();
  }
  const createdAt = row.created_at instanceof Date ? row.created_at : new Date(row.created_at);
  if (Number.isNaN(createdAt.getTime())) throw new WorkspaceStoreError();
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

function isWorkspaceRole(value: string): value is WorkspaceRole {
  return value === "owner" || value === "admin" || value === "editor" || value === "viewer";
}

function normalizeWorkspaceId(value: string): string {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)) {
    throw new WorkspaceStoreError();
  }
  return value.toLowerCase();
}
