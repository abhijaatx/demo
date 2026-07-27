import {
  AuthorizationDeniedError,
  capabilitiesForRole,
  FolderConflictError,
  folderFingerprint,
  FolderStoreError,
  FolderValidationError,
  maxFolderDepth,
  normalizeFolderId,
  normalizeFolderVersion,
  normalizeIdempotencyKey,
  normalizeUserId,
  parseCreateFolderInput,
  parseMoveFolderInput,
  parseUpdateFolderInput,
  type CreateFolderInput,
  type Folder,
  type FolderRepository,
  type MoveFolderInput,
  type UpdateFolderInput,
  type WorkspaceRole
} from "@supademo/domain";
import type { Pool } from "pg";
import { createUuidV7 } from "./ids.js";
import { query } from "./pool.js";
import { withTransaction } from "./transaction.js";

type FolderRow = Readonly<{
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  version: number;
  created_at: Date | string;
  updated_at: Date | string;
}>;

const folderColumns = [
  "id",
  "workspace_id",
  "parent_id",
  "name",
  "version",
  "created_at",
  "updated_at"
].join(", ");

export class DatabaseFolderRepository implements FolderRepository {
  constructor(private readonly pool: Pool) {}

  async list(actorUserIdInput: string, workspaceIdInput: string): Promise<readonly Folder[]> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireFolderCapability(client, workspaceId, actorUserId, "demo:read");
        const result = await query<FolderRow>(
          client,
          `SELECT ${folderColumns} FROM folders WHERE workspace_id = $1 ORDER BY name ASC, id ASC`,
          [workspaceId]
        );
        return Object.freeze(result.rows.map(mapFolder));
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async create(
    actorUserIdInput: string,
    workspaceIdInput: string,
    inputValue: CreateFolderInput,
    idempotencyKeyInput: string
  ): Promise<Folder> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const input = parseCreateFolderInput(inputValue);
    const idempotencyKey = normalizeIdempotencyKey(idempotencyKeyInput);
    const fingerprint = folderFingerprint(input);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireFolderCapability(client, workspaceId, actorUserId, "demo:update");
        await lockWorkspaceStructure(client, workspaceId);
        if (input.parentId) await assertParentCanContain(client, workspaceId, input.parentId, 1);
        const request = await query<{ folder_id: string | null }>(
          client,
          `
            INSERT INTO folder_creation_requests
              (workspace_id, owner_user_id, idempotency_key, request_fingerprint)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (workspace_id, owner_user_id, idempotency_key) DO NOTHING
            RETURNING folder_id
          `,
          [workspaceId, actorUserId, idempotencyKey, fingerprint]
        );
        if (!request.rows[0]) {
          const existing = await query<{ request_fingerprint: string; folder_id: string | null }>(
            client,
            `
              SELECT request_fingerprint, folder_id
              FROM folder_creation_requests
              WHERE workspace_id = $1 AND owner_user_id = $2 AND idempotency_key = $3
              FOR UPDATE
            `,
            [workspaceId, actorUserId, idempotencyKey]
          );
          const replay = existing.rows[0];
          if (!replay || replay.request_fingerprint !== fingerprint || !replay.folder_id) {
            throw new FolderConflictError(
              "The folder creation request conflicts with an existing request."
            );
          }
          const folder = await findFolder(client, workspaceId, replay.folder_id);
          if (!folder)
            throw new FolderConflictError("The folder creation request cannot be replayed.");
          return mapFolder(folder);
        }
        const result = await query<FolderRow>(
          client,
          `
            INSERT INTO folders (id, workspace_id, parent_id, name, created_by_user_id)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING ${folderColumns}
          `,
          [createUuidV7(), workspaceId, input.parentId, input.name, actorUserId]
        );
        const folder = result.rows[0];
        if (!folder) throw new FolderStoreError();
        await query(
          client,
          `
            UPDATE folder_creation_requests
            SET folder_id = $4
            WHERE workspace_id = $1 AND owner_user_id = $2 AND idempotency_key = $3
          `,
          [workspaceId, actorUserId, idempotencyKey, folder.id]
        );
        await insertFolderAuditEvent(
          client,
          workspaceId,
          folder.id,
          actorUserId,
          "folder.created",
          null,
          input.parentId
        );
        return mapFolder(folder);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async update(
    actorUserIdInput: string,
    workspaceIdInput: string,
    folderIdInput: string,
    inputValue: UpdateFolderInput
  ): Promise<Folder | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const folderId = normalizeFolderId(folderIdInput);
    const input = parseUpdateFolderInput(inputValue);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireFolderCapability(client, workspaceId, actorUserId, "demo:update");
        await lockWorkspaceStructure(client, workspaceId);
        const current = await findFolder(client, workspaceId, folderId, true);
        if (!current) return null;
        if (current.version !== input.expectedVersion) throw new FolderConflictError();
        const result = await query<FolderRow>(
          client,
          `
            UPDATE folders
            SET name = $3, version = version + 1, updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND version = $4
            RETURNING ${folderColumns}
          `,
          [folderId, workspaceId, input.name, input.expectedVersion]
        );
        const folder = result.rows[0];
        if (!folder) throw new FolderConflictError();
        await insertFolderAuditEvent(
          client,
          workspaceId,
          folderId,
          actorUserId,
          "folder.renamed",
          current.parent_id,
          current.parent_id
        );
        return mapFolder(folder);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async move(
    actorUserIdInput: string,
    workspaceIdInput: string,
    folderIdInput: string,
    inputValue: MoveFolderInput
  ): Promise<Folder | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const folderId = normalizeFolderId(folderIdInput);
    const input = parseMoveFolderInput(inputValue);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireFolderCapability(client, workspaceId, actorUserId, "demo:update");
        await lockWorkspaceStructure(client, workspaceId);
        const current = await findFolder(client, workspaceId, folderId, true);
        if (!current) return null;
        if (current.version !== input.expectedVersion) throw new FolderConflictError();
        if (input.parentId === folderId)
          throw new FolderConflictError("A folder cannot contain itself.");
        if (input.parentId) {
          const subtreeHeight = await getSubtreeHeight(client, workspaceId, folderId);
          await assertParentCanContain(
            client,
            workspaceId,
            input.parentId,
            subtreeHeight,
            folderId
          );
        }
        const result = await query<FolderRow>(
          client,
          `
            UPDATE folders
            SET parent_id = $3, version = version + 1, updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND version = $4
            RETURNING ${folderColumns}
          `,
          [folderId, workspaceId, input.parentId, input.expectedVersion]
        );
        const folder = result.rows[0];
        if (!folder) throw new FolderConflictError();
        await insertFolderAuditEvent(
          client,
          workspaceId,
          folderId,
          actorUserId,
          "folder.moved",
          current.parent_id,
          input.parentId
        );
        return mapFolder(folder);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async delete(
    actorUserIdInput: string,
    workspaceIdInput: string,
    folderIdInput: string,
    expectedVersionInput: number
  ): Promise<boolean> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeWorkspaceId(workspaceIdInput);
    const folderId = normalizeFolderId(folderIdInput);
    const expectedVersion = normalizeFolderVersion(expectedVersionInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireFolderCapability(client, workspaceId, actorUserId, "demo:update");
        await lockWorkspaceStructure(client, workspaceId);
        const current = await findFolder(client, workspaceId, folderId, true);
        if (!current) return false;
        if (current.version !== expectedVersion) throw new FolderConflictError();
        await query(
          client,
          `
            UPDATE demos SET folder_id = $3, updated_at = now()
            WHERE workspace_id = $1 AND folder_id = $2
          `,
          [workspaceId, folderId, current.parent_id]
        );
        await query(
          client,
          `
            UPDATE folders SET parent_id = $3, version = version + 1, updated_at = now()
            WHERE workspace_id = $1 AND parent_id = $2
          `,
          [workspaceId, folderId, current.parent_id]
        );
        const removed = await query<{ id: string }>(
          client,
          `DELETE FROM folders WHERE id = $1 AND workspace_id = $2 AND version = $3 RETURNING id`,
          [folderId, workspaceId, expectedVersion]
        );
        if (!removed.rows[0]) throw new FolderConflictError();
        await insertFolderAuditEvent(
          client,
          workspaceId,
          folderId,
          actorUserId,
          "folder.deleted",
          current.parent_id,
          null
        );
        return true;
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }
}

async function lockWorkspaceStructure(
  executor: Parameters<typeof query>[0],
  workspaceId: string
): Promise<void> {
  await query(executor, "SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))", [
    workspaceId
  ]);
}

async function findFolder(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  folderId: string,
  lock = false
): Promise<FolderRow | undefined> {
  const result = await query<FolderRow>(
    executor,
    `SELECT ${folderColumns} FROM folders WHERE id = $1 AND workspace_id = $2 LIMIT 1${lock ? " FOR UPDATE" : ""}`,
    [folderId, workspaceId]
  );
  return result.rows[0];
}

async function getSubtreeHeight(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  folderId: string
): Promise<number> {
  const result = await query<{ height: number }>(
    executor,
    `
      WITH RECURSIVE subtree AS (
        SELECT id, 1 AS depth FROM folders WHERE id = $1 AND workspace_id = $2
        UNION ALL
        SELECT child.id, subtree.depth + 1
        FROM folders child JOIN subtree ON child.parent_id = subtree.id
        WHERE child.workspace_id = $2 AND subtree.depth < $3
      )
      SELECT MAX(depth)::int AS height FROM subtree
    `,
    [folderId, workspaceId, maxFolderDepth]
  );
  const height = result.rows[0]?.height;
  if (!Number.isSafeInteger(height) || !height || height < 1) throw new FolderStoreError();
  return height;
}

async function assertParentCanContain(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  parentId: string,
  childHeight: number,
  movedFolderId?: string
): Promise<void> {
  const result = await query<{ depth: number; contains_moved_folder: boolean }>(
    executor,
    `
      WITH RECURSIVE ancestors AS (
        SELECT id, parent_id, 1 AS depth FROM folders WHERE id = $1 AND workspace_id = $2
        UNION ALL
        SELECT parent.id, parent.parent_id, ancestors.depth + 1
        FROM folders parent JOIN ancestors ON ancestors.parent_id = parent.id
        WHERE parent.workspace_id = $2 AND ancestors.depth < $3
      )
      SELECT
        COALESCE(MAX(depth), 0)::int AS depth,
        COALESCE(BOOL_OR(id = $4::uuid), false) AS contains_moved_folder
      FROM ancestors
    `,
    [parentId, workspaceId, maxFolderDepth, movedFolderId ?? "00000000-0000-0000-0000-000000000000"]
  );
  const parent = result.rows[0];
  if (!parent || parent.depth < 1)
    throw new FolderValidationError("The parent folder was not found.", "parentId");
  if (parent.contains_moved_folder)
    throw new FolderConflictError("A folder cannot be moved into its own child.");
  if (parent.depth + childHeight > maxFolderDepth) {
    throw new FolderValidationError(
      `Folders can be nested only ${maxFolderDepth} levels deep.`,
      "parentId"
    );
  }
}

async function requireFolderCapability(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  userId: string,
  capability: "demo:read" | "demo:update"
): Promise<void> {
  const result = await query<{ role: WorkspaceRole }>(
    executor,
    "SELECT role FROM memberships WHERE workspace_id = $1 AND user_id = $2 FOR SHARE",
    [workspaceId, userId]
  );
  const role = result.rows[0]?.role;
  if (!role || !capabilitiesForRole(role).includes(capability))
    throw new AuthorizationDeniedError();
}

async function insertFolderAuditEvent(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  folderId: string,
  actorUserId: string,
  action: "folder.created" | "folder.renamed" | "folder.moved" | "folder.deleted",
  previousParentId: string | null,
  parentId: string | null
): Promise<void> {
  await query(
    executor,
    `
      INSERT INTO folder_audit_events
        (id, workspace_id, folder_id, actor_user_id, action, previous_parent_id, parent_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `,
    [createUuidV7(), workspaceId, folderId, actorUserId, action, previousParentId, parentId]
  );
}

function mapFolder(row: FolderRow): Folder {
  if (
    typeof row.id !== "string" ||
    typeof row.workspace_id !== "string" ||
    (row.parent_id !== null && typeof row.parent_id !== "string") ||
    typeof row.name !== "string" ||
    !Number.isSafeInteger(row.version) ||
    row.version < 1
  ) {
    throw new FolderStoreError();
  }
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspace_id,
    parentId: row.parent_id,
    name: row.name,
    version: row.version,
    createdAt: requireIso(row.created_at),
    updatedAt: requireIso(row.updated_at)
  });
}

function requireIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new FolderStoreError();
  return date.toISOString();
}

function normalizeWorkspaceId(value: unknown): string {
  try {
    return normalizeUserId(value);
  } catch {
    throw new FolderValidationError("The workspace identifier is invalid.", "workspaceId");
  }
}

function normalizeStoreError(error: unknown): Error {
  if (
    error instanceof AuthorizationDeniedError ||
    error instanceof FolderConflictError ||
    error instanceof FolderStoreError ||
    error instanceof FolderValidationError
  ) {
    return error;
  }
  return new FolderStoreError();
}
