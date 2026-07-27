import {
  AuthorizationDeniedError,
  capabilitiesForRole,
  CommentNotFoundError,
  CommentStoreError,
  CommentValidationError,
  normalizeCommentId,
  normalizeUserId,
  parseCreateCommentInput,
  parseToggleCommentReactionInput,
  parseUpdateCommentInput,
  type Comment,
  type CommentReaction,
  type CommentRepository,
  type CommentTargetType,
  type CreateCommentInput,
  type UpdateCommentInput,
  type WorkspaceCapability,
  type WorkspaceRole
} from "@supademo/domain";
import { createUuidV7 } from "./ids.js";
import { query } from "./pool.js";
import { withTransaction } from "./transaction.js";

type CommentRow = Readonly<{
  id: string;
  workspace_id: string;
  target_type: CommentTargetType;
  target_id: string;
  thread_id: string;
  parent_id: string | null;
  author_user_id: string;
  content: string;
  mentions: unknown;
  reactions: unknown;
  is_resolved: boolean;
  resolved_by_user_id: string | null;
  resolved_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  deleted_at: Date | string | null;
}>;

export class DatabaseCommentRepository implements CommentRepository {
  constructor(private readonly pool: import("pg").Pool) {}

  async list(
    actorUserIdInput: string,
    workspaceIdInput: string,
    targetType: CommentTargetType,
    targetIdInput: string
  ): Promise<readonly Comment[]> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const targetId = normalizeCommentId(targetIdInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:read");
        const result = await query<CommentRow>(
          client,
          `
            SELECT ${commentColumns}
            FROM demo_comments
            WHERE workspace_id = $1 AND target_type = $2 AND target_id = $3 AND deleted_at IS NULL
            ORDER BY created_at ASC
          `,
          [workspaceId, targetType, targetId]
        );
        return result.rows.map(mapComment);
      });
    } catch (error) {
      throw normalizeCommentError(error);
    }
  }

  async create(
    actorUserIdInput: string,
    workspaceIdInput: string,
    inputInput: CreateCommentInput,
    _idempotencyKeyInput?: string
  ): Promise<Comment> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const input = parseCreateCommentInput(inputInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:read");

        // Verify target exists in workspace
        if (input.targetType === "demo") {
          const demo = await query<{ id: string }>(
            client,
            "SELECT id FROM demos WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL LIMIT 1 FOR SHARE",
            [input.targetId, workspaceId]
          );
          if (!demo.rows[0]) throw new CommentNotFoundError("Target demo was not found.");
        }

        let threadId: string = createUuidV7();
        if (input.parentId) {
          const parent = await query<{ id: string; thread_id: string }>(
            client,
            "SELECT id, thread_id FROM demo_comments WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL LIMIT 1 FOR SHARE",
            [input.parentId, workspaceId]
          );
          if (!parent.rows[0]) throw new CommentNotFoundError("Parent comment was not found.");
          threadId = parent.rows[0].thread_id;
        }

        const newCommentId = createUuidV7();
        const result = await query<CommentRow>(
          client,
          `
            INSERT INTO demo_comments (
              id, workspace_id, target_type, target_id, thread_id, parent_id, author_user_id, content, mentions, reactions
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, '[]'::jsonb
            )
            RETURNING ${commentColumns}
          `,
          [
            newCommentId,
            workspaceId,
            input.targetType,
            input.targetId,
            threadId,
            input.parentId ?? null,
            actorUserId,
            input.content,
            JSON.stringify(input.mentions ?? [])
          ]
        );
        const row = result.rows[0];
        if (!row) throw new CommentStoreError();

        await insertDemoAuditEvent(
          client,
          workspaceId,
          input.targetType === "demo" ? input.targetId : null,
          actorUserId,
          "comment.created"
        );
        return mapComment(row);
      });
    } catch (error) {
      throw normalizeCommentError(error);
    }
  }

  async update(
    actorUserIdInput: string,
    workspaceIdInput: string,
    commentIdInput: string,
    inputInput: UpdateCommentInput
  ): Promise<Comment | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const commentId = normalizeCommentId(commentIdInput);
    const input = parseUpdateCommentInput(inputInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:read");
        const existing = await query<{ author_user_id: string; target_id: string }>(
          client,
          "SELECT author_user_id, target_id FROM demo_comments WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL FOR UPDATE",
          [commentId, workspaceId]
        );
        if (!existing.rows[0]) throw new CommentNotFoundError();
        if (existing.rows[0].author_user_id !== actorUserId) {
          throw new AuthorizationDeniedError();
        }

        const result = await query<CommentRow>(
          client,
          `
            UPDATE demo_comments
            SET content = $3, updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING ${commentColumns}
          `,
          [commentId, workspaceId, input.content]
        );
        const row = result.rows[0];
        if (!row) return null;

        await insertDemoAuditEvent(
          client,
          workspaceId,
          existing.rows[0].target_id,
          actorUserId,
          "comment.updated"
        );
        return mapComment(row);
      });
    } catch (error) {
      throw normalizeCommentError(error);
    }
  }

  async delete(
    actorUserIdInput: string,
    workspaceIdInput: string,
    commentIdInput: string
  ): Promise<boolean> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const commentId = normalizeCommentId(commentIdInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:read");
        const existing = await query<{ author_user_id: string; target_id: string }>(
          client,
          "SELECT author_user_id, target_id FROM demo_comments WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL FOR UPDATE",
          [commentId, workspaceId]
        );
        if (!existing.rows[0]) return true; // Idempotent delete

        // Check if author or workspace demo:update capability
        const roleResult = await query<{ role: WorkspaceRole }>(
          client,
          "SELECT role FROM memberships WHERE workspace_id = $1 AND user_id = $2 FOR SHARE",
          [workspaceId, actorUserId]
        );
        const role = roleResult.rows[0]?.role;
        const canManage = role && capabilitiesForRole(role).includes("demo:update");
        if (existing.rows[0].author_user_id !== actorUserId && !canManage) {
          throw new AuthorizationDeniedError();
        }

        await query(
          client,
          "UPDATE demo_comments SET deleted_at = now() WHERE id = $1 AND workspace_id = $2",
          [commentId, workspaceId]
        );
        await insertDemoAuditEvent(
          client,
          workspaceId,
          existing.rows[0].target_id,
          actorUserId,
          "comment.deleted"
        );
        return true;
      });
    } catch (error) {
      throw normalizeCommentError(error);
    }
  }

  async toggleResolve(
    actorUserIdInput: string,
    workspaceIdInput: string,
    commentIdInput: string,
    isResolved: boolean
  ): Promise<Comment | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const commentId = normalizeCommentId(commentIdInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:read");
        const existing = await query<{ id: string; target_id: string }>(
          client,
          "SELECT id, target_id FROM demo_comments WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL FOR UPDATE",
          [commentId, workspaceId]
        );
        if (!existing.rows[0]) throw new CommentNotFoundError();

        const result = await query<CommentRow>(
          client,
          `
            UPDATE demo_comments
            SET
              is_resolved = $3,
              resolved_by_user_id = CASE WHEN $3 = true THEN $4 ELSE NULL END,
              resolved_at = CASE WHEN $3 = true THEN now() ELSE NULL END,
              updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING ${commentColumns}
          `,
          [commentId, workspaceId, isResolved, actorUserId]
        );
        const row = result.rows[0];
        if (!row) return null;

        await insertDemoAuditEvent(
          client,
          workspaceId,
          existing.rows[0].target_id,
          actorUserId,
          isResolved ? "comment.resolved" : "comment.reopened"
        );
        return mapComment(row);
      });
    } catch (error) {
      throw normalizeCommentError(error);
    }
  }

  async toggleReaction(
    actorUserIdInput: string,
    workspaceIdInput: string,
    commentIdInput: string,
    emojiInput: string
  ): Promise<Comment | null> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const commentId = normalizeCommentId(commentIdInput);
    const input = parseToggleCommentReactionInput({ emoji: emojiInput });

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceCapability(client, workspaceId, actorUserId, "demo:read");
        const existing = await query<{ reactions: unknown; target_id: string }>(
          client,
          "SELECT reactions, target_id FROM demo_comments WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL FOR UPDATE",
          [commentId, workspaceId]
        );
        if (!existing.rows[0]) throw new CommentNotFoundError();

        const reactions = parseReactions(existing.rows[0].reactions);
        const existingIndex = reactions.findIndex((r) => r.emoji === input.emoji);
        let updatedReactions: CommentReaction[];
        let action: "comment.reaction_added" | "comment.reaction_removed" =
          "comment.reaction_added";

        if (existingIndex >= 0) {
          const target = reactions[existingIndex]!;
          if (target.userIds.includes(actorUserId)) {
            // Remove user reaction
            action = "comment.reaction_removed";
            const nextUsers = target.userIds.filter((id) => id !== actorUserId);
            if (nextUsers.length === 0) {
              updatedReactions = reactions.filter((_, idx) => idx !== existingIndex);
            } else {
              updatedReactions = reactions.map((r, idx) =>
                idx === existingIndex ? { emoji: r.emoji, userIds: nextUsers } : r
              );
            }
          } else {
            // Add user reaction to existing emoji
            updatedReactions = reactions.map((r, idx) =>
              idx === existingIndex ? { emoji: r.emoji, userIds: [...r.userIds, actorUserId] } : r
            );
          }
        } else {
          // Add new emoji reaction
          updatedReactions = [...reactions, { emoji: input.emoji, userIds: [actorUserId] }];
        }

        const result = await query<CommentRow>(
          client,
          `
            UPDATE demo_comments
            SET reactions = $3::jsonb, updated_at = now()
            WHERE id = $1 AND workspace_id = $2 AND deleted_at IS NULL
            RETURNING ${commentColumns}
          `,
          [commentId, workspaceId, JSON.stringify(updatedReactions)]
        );
        const row = result.rows[0];
        if (!row) return null;

        await insertDemoAuditEvent(
          client,
          workspaceId,
          existing.rows[0].target_id,
          actorUserId,
          action
        );
        return mapComment(row);
      });
    } catch (error) {
      throw normalizeCommentError(error);
    }
  }
}

const commentColumns = [
  "id",
  "workspace_id",
  "target_type",
  "target_id",
  "thread_id",
  "parent_id",
  "author_user_id",
  "content",
  "mentions",
  "reactions",
  "is_resolved",
  "resolved_by_user_id",
  "resolved_at",
  "created_at",
  "updated_at",
  "deleted_at"
].join(", ");

async function requireWorkspaceCapability(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  userId: string,
  capability: WorkspaceCapability
): Promise<void> {
  const result = await query<{ role: WorkspaceRole }>(
    executor,
    "SELECT role FROM memberships WHERE workspace_id = $1 AND user_id = $2 FOR SHARE",
    [workspaceId, userId]
  );
  const role = result.rows[0]?.role;
  if (!role || !capabilitiesForRole(role).includes(capability)) {
    throw new AuthorizationDeniedError();
  }
}

async function insertDemoAuditEvent(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  demoId: string | null,
  actorUserId: string,
  action: string
): Promise<void> {
  await query(
    executor,
    `
      INSERT INTO demo_audit_events
        (id, workspace_id, demo_id, actor_user_id, action, previous_status, status)
      VALUES ($1, $2, $3, $4, $5, NULL, NULL)
    `,
    [createUuidV7(), workspaceId, demoId, actorUserId, action]
  );
}

function mapComment(row: CommentRow): Comment {
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspace_id,
    targetType: row.target_type,
    targetId: row.target_id,
    threadId: row.thread_id,
    parentId: row.parent_id,
    authorUserId: row.author_user_id,
    content: row.content,
    mentions: parseMentions(row.mentions),
    reactions: parseReactions(row.reactions),
    isResolved: Boolean(row.is_resolved),
    resolvedByUserId: row.resolved_by_user_id,
    resolvedAt: toIso(row.resolved_at),
    createdAt: requireIso(row.created_at),
    updatedAt: requireIso(row.updated_at),
    deletedAt: toIso(row.deleted_at)
  });
}

function parseMentions(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  return Object.freeze(value.filter((v): v is string => typeof v === "string"));
}

function parseReactions(value: unknown): CommentReaction[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null)
    .map((r) => ({
      emoji: String(r["emoji"] ?? ""),
      userIds: Array.isArray(r["userIds"])
        ? r["userIds"].filter((id): id is string => typeof id === "string")
        : []
    }))
    .filter((r) => r.emoji.length > 0);
}

function requireIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new CommentStoreError();
  return date.toISOString();
}

function toIso(value: Date | string | null): string | null {
  if (value === null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeCommentError(error: unknown): Error {
  if (
    error instanceof AuthorizationDeniedError ||
    error instanceof CommentNotFoundError ||
    error instanceof CommentStoreError ||
    error instanceof CommentValidationError
  ) {
    return error;
  }
  return new CommentStoreError();
}
