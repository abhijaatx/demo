import {
  AuthorizationDeniedError,
  capabilitiesForRole,
  normalizeDemoId,
  normalizeIdempotencyKey,
  normalizeTagId,
  normalizeUserId,
  parseCreateTagInput,
  tagFingerprint,
  TagConflictError,
  TagStoreError,
  TagValidationError,
  type CreateTagInput,
  type Tag,
  type TagRepository,
  type WorkspaceRole
} from "@supademo/domain";
import type { Pool } from "pg";
import { createUuidV7 } from "./ids.js";
import { query } from "./pool.js";
import { withTransaction } from "./transaction.js";

type TagRow = Readonly<{
  id: string;
  workspace_id: string;
  name: string;
  created_at: Date | string;
  updated_at: Date | string;
}>;
const tagColumns = "id, workspace_id, name, created_at, updated_at";

export class DatabaseTagRepository implements TagRepository {
  constructor(private readonly pool: Pool) {}

  async list(actorInput: string, workspaceInput: string): Promise<readonly Tag[]> {
    const actor = normalizeUserId(actorInput);
    const workspaceId = normalizeWorkspaceId(workspaceInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireTagCapability(client, workspaceId, actor, "demo:read");
        const result = await query<TagRow>(
          client,
          `SELECT ${tagColumns} FROM tags WHERE workspace_id = $1 ORDER BY lower(name), id`,
          [workspaceId]
        );
        return Object.freeze(result.rows.map(mapTag));
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async create(
    actorInput: string,
    workspaceInput: string,
    inputValue: CreateTagInput,
    keyInput: string
  ): Promise<Tag> {
    const actor = normalizeUserId(actorInput);
    const workspaceId = normalizeWorkspaceId(workspaceInput);
    const input = parseCreateTagInput(inputValue);
    const key = normalizeIdempotencyKey(keyInput);
    const fingerprint = tagFingerprint(input);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireTagCapability(client, workspaceId, actor, "demo:update");
        const request = await query<{ tag_id: string | null }>(
          client,
          `
          INSERT INTO tag_creation_requests (workspace_id, owner_user_id, idempotency_key, request_fingerprint)
          VALUES ($1, $2, $3, $4) ON CONFLICT (workspace_id, owner_user_id, idempotency_key) DO NOTHING
          RETURNING tag_id`,
          [workspaceId, actor, key, fingerprint]
        );
        if (!request.rows[0]) {
          const replay = await query<{ request_fingerprint: string; tag_id: string | null }>(
            client,
            `
            SELECT request_fingerprint, tag_id FROM tag_creation_requests
            WHERE workspace_id = $1 AND owner_user_id = $2 AND idempotency_key = $3 FOR UPDATE`,
            [workspaceId, actor, key]
          );
          const existing = replay.rows[0];
          if (!existing || existing.request_fingerprint !== fingerprint || !existing.tag_id)
            throw new TagConflictError(
              "The tag creation request conflicts with an existing request."
            );
          const found = await query<TagRow>(
            client,
            `SELECT ${tagColumns} FROM tags WHERE id = $1 AND workspace_id = $2`,
            [existing.tag_id, workspaceId]
          );
          if (!found.rows[0])
            throw new TagConflictError("The tag creation request cannot be replayed.");
          return mapTag(found.rows[0]);
        }
        const result = await query<TagRow>(
          client,
          `
          INSERT INTO tags (id, workspace_id, name, created_by_user_id) VALUES ($1, $2, $3, $4)
          RETURNING ${tagColumns}`,
          [createUuidV7(), workspaceId, input.name, actor]
        );
        const tag = result.rows[0];
        if (!tag) throw new TagStoreError();
        await query(
          client,
          `UPDATE tag_creation_requests SET tag_id = $4 WHERE workspace_id = $1 AND owner_user_id = $2 AND idempotency_key = $3`,
          [workspaceId, actor, key, tag.id]
        );
        return mapTag(tag);
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async assignToDemo(
    actorInput: string,
    workspaceInput: string,
    demoInput: string,
    tagInput: string
  ): Promise<void> {
    const actor = normalizeUserId(actorInput);
    const workspaceId = normalizeWorkspaceId(workspaceInput);
    const demoId = normalizeDemoId(demoInput);
    const tagId = normalizeTagId(tagInput);
    try {
      await withTransaction(this.pool, async (client) => {
        await requireTagCapability(client, workspaceId, actor, "demo:update");
        const result = await query<{ id: string }>(
          client,
          `
        SELECT demo.id FROM demos demo JOIN tags tag ON tag.workspace_id = demo.workspace_id
        WHERE demo.id = $1 AND demo.workspace_id = $2 AND demo.deleted_at IS NULL AND tag.id = $3 LIMIT 1 FOR SHARE`,
          [demoId, workspaceId, tagId]
        );
        if (!result.rows[0]) throw new TagValidationError("The demo or tag was not found.");
        const assignment = await query<{ tag_id: string }>(
          client,
          `
            INSERT INTO demo_tags (workspace_id, demo_id, tag_id)
            VALUES ($1, $2, $3)
            ON CONFLICT DO NOTHING
            RETURNING tag_id
          `,
          [workspaceId, demoId, tagId]
        );
        if (assignment.rows[0]) {
          await insertDemoTagAuditEvent(client, workspaceId, demoId, tagId, actor, "tag.assigned");
        }
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }

  async removeFromDemo(
    actorInput: string,
    workspaceInput: string,
    demoInput: string,
    tagInput: string
  ): Promise<boolean> {
    const actor = normalizeUserId(actorInput);
    const workspaceId = normalizeWorkspaceId(workspaceInput);
    const demoId = normalizeDemoId(demoInput);
    const tagId = normalizeTagId(tagInput);
    try {
      return await withTransaction(this.pool, async (client) => {
        await requireTagCapability(client, workspaceId, actor, "demo:update");
        const result = await query<{ tag_id: string }>(
          client,
          `DELETE FROM demo_tags WHERE workspace_id = $1 AND demo_id = $2 AND tag_id = $3 RETURNING tag_id`,
          [workspaceId, demoId, tagId]
        );
        if (!result.rows[0]) return false;
        await insertDemoTagAuditEvent(client, workspaceId, demoId, tagId, actor, "tag.removed");
        return true;
      });
    } catch (error) {
      throw normalizeStoreError(error);
    }
  }
}

async function requireTagCapability(
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
function mapTag(row: TagRow): Tag {
  if (
    typeof row.id !== "string" ||
    typeof row.workspace_id !== "string" ||
    typeof row.name !== "string"
  )
    throw new TagStoreError();
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at)
  });
}
function iso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new TagStoreError();
  return date.toISOString();
}
function normalizeWorkspaceId(value: unknown): string {
  try {
    return normalizeUserId(value);
  } catch {
    throw new TagValidationError("The workspace identifier is invalid.", "workspaceId");
  }
}
function normalizeStoreError(error: unknown): Error {
  if (
    error instanceof AuthorizationDeniedError ||
    error instanceof TagConflictError ||
    error instanceof TagStoreError ||
    error instanceof TagValidationError
  )
    return error;
  if (isUniqueViolation(error)) return new TagConflictError("That tag name already exists.");
  return new TagStoreError();
}

async function insertDemoTagAuditEvent(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  demoId: string,
  tagId: string,
  actorUserId: string,
  action: "tag.assigned" | "tag.removed"
): Promise<void> {
  await query(
    executor,
    `
      INSERT INTO demo_tag_audit_events (id, workspace_id, demo_id, tag_id, actor_user_id, action)
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [createUuidV7(), workspaceId, demoId, tagId, actorUserId, action]
  );
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { readonly code?: unknown }).code === "23505"
  );
}
