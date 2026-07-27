import {
  AuthorizationDeniedError,
  NotificationNotFoundError,
  NotificationStoreError,
  NotificationValidationError,
  normalizeUserId,
  parseCreateNotificationInput,
  parseMarkNotificationReadInput,
  type CreateNotificationInput,
  type Notification,
  type NotificationRepository,
  type NotificationType,
  type WorkspaceRole
} from "@supademo/domain";
import { createUuidV7 } from "./ids.js";
import { query } from "./pool.js";
import { withTransaction } from "./transaction.js";

type NotificationRow = Readonly<{
  id: string;
  workspace_id: string;
  recipient_user_id: string;
  actor_user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  target_type: "demo" | "step" | "workspace" | "comment";
  target_id: string;
  is_read: boolean;
  read_at: Date | string | null;
  created_at: Date | string;
}>;

export class DatabaseNotificationRepository implements NotificationRepository {
  constructor(private readonly pool: import("pg").Pool) {}

  async list(
    actorUserIdInput: string,
    workspaceIdInput: string,
    unreadOnly = false
  ): Promise<readonly Notification[]> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);
        const result = await query<NotificationRow>(
          client,
          `
            SELECT ${notificationColumns}
            FROM user_notifications
            WHERE workspace_id = $1 AND recipient_user_id = $2 ${unreadOnly ? "AND is_read = false" : ""}
            ORDER BY created_at DESC
            LIMIT 100
          `,
          [workspaceId, actorUserId]
        );
        return result.rows.map(mapNotification);
      });
    } catch (error) {
      throw normalizeNotificationError(error);
    }
  }

  async unreadCount(actorUserIdInput: string, workspaceIdInput: string): Promise<number> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);
        const result = await query<{ count: string }>(
          client,
          `
            SELECT COUNT(*)::text AS count
            FROM user_notifications
            WHERE workspace_id = $1 AND recipient_user_id = $2 AND is_read = false
          `,
          [workspaceId, actorUserId]
        );
        return Number.parseInt(result.rows[0]?.count ?? "0", 10);
      });
    } catch (error) {
      throw normalizeNotificationError(error);
    }
  }

  async markRead(
    actorUserIdInput: string,
    workspaceIdInput: string,
    notificationIdInput?: string | null
  ): Promise<number> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const input = parseMarkNotificationReadInput({ notificationId: notificationIdInput });

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);

        if (input.notificationId) {
          const result = await query(
            client,
            `
              UPDATE user_notifications
              SET is_read = true, read_at = now()
              WHERE id = $1 AND workspace_id = $2 AND recipient_user_id = $3 AND is_read = false
            `,
            [input.notificationId, workspaceId, actorUserId]
          );
          return result.rowCount ?? 0;
        }

        const result = await query(
          client,
          `
            UPDATE user_notifications
            SET is_read = true, read_at = now()
            WHERE workspace_id = $1 AND recipient_user_id = $2 AND is_read = false
          `,
          [workspaceId, actorUserId]
        );
        return result.rowCount ?? 0;
      });
    } catch (error) {
      throw normalizeNotificationError(error);
    }
  }

  async create(
    actorUserIdInput: string,
    workspaceIdInput: string,
    inputInput: CreateNotificationInput
  ): Promise<Notification> {
    const actorUserId = normalizeUserId(actorUserIdInput);
    const workspaceId = normalizeUserId(workspaceIdInput);
    const input = parseCreateNotificationInput(inputInput);

    try {
      return await withTransaction(this.pool, async (client) => {
        await requireWorkspaceMembership(client, workspaceId, actorUserId);

        const newId = createUuidV7();
        const result = await query<NotificationRow>(
          client,
          `
            INSERT INTO user_notifications (
              id, workspace_id, recipient_user_id, actor_user_id, type, title, message, target_type, target_id, is_read
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, false
            )
            RETURNING ${notificationColumns}
          `,
          [
            newId,
            workspaceId,
            input.recipientUserId,
            actorUserId,
            input.type,
            input.title,
            input.message,
            input.targetType,
            input.targetId
          ]
        );
        const row = result.rows[0];
        if (!row) throw new NotificationStoreError();
        return mapNotification(row);
      });
    } catch (error) {
      throw normalizeNotificationError(error);
    }
  }
}

const notificationColumns = [
  "id",
  "workspace_id",
  "recipient_user_id",
  "actor_user_id",
  "type",
  "title",
  "message",
  "target_type",
  "target_id",
  "is_read",
  "read_at",
  "created_at"
].join(", ");

async function requireWorkspaceMembership(
  executor: Parameters<typeof query>[0],
  workspaceId: string,
  userId: string
): Promise<void> {
  const result = await query<{ role: WorkspaceRole }>(
    executor,
    "SELECT role FROM memberships WHERE workspace_id = $1 AND user_id = $2 FOR SHARE",
    [workspaceId, userId]
  );
  if (!result.rows[0]) throw new AuthorizationDeniedError();
}

function mapNotification(row: NotificationRow): Notification {
  return Object.freeze({
    id: row.id,
    workspaceId: row.workspace_id,
    recipientUserId: row.recipient_user_id,
    actorUserId: row.actor_user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    targetType: row.target_type,
    targetId: row.target_id,
    isRead: Boolean(row.is_read),
    readAt: toIso(row.read_at),
    createdAt: requireIso(row.created_at)
  });
}

function requireIso(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new NotificationStoreError();
  return date.toISOString();
}

function toIso(value: Date | string | null): string | null {
  if (value === null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeNotificationError(error: unknown): Error {
  if (
    error instanceof AuthorizationDeniedError ||
    error instanceof NotificationNotFoundError ||
    error instanceof NotificationStoreError ||
    error instanceof NotificationValidationError
  ) {
    return error;
  }
  return new NotificationStoreError();
}
