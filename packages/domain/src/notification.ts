export const notificationTypes = [
  "comment_mention",
  "comment_reply",
  "workspace_invite",
  "review_requested",
  "review_approved",
  "review_changes_requested"
] as const;
export type NotificationType = (typeof notificationTypes)[number];

export type Notification = Readonly<{
  id: string;
  workspaceId: string;
  recipientUserId: string;
  actorUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  targetType: "demo" | "step" | "workspace" | "comment";
  targetId: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
}>;

export type CreateNotificationInput = Readonly<{
  recipientUserId: string;
  type: NotificationType;
  title: string;
  message: string;
  targetType: "demo" | "step" | "workspace" | "comment";
  targetId: string;
}>;

export type MarkNotificationReadInput = Readonly<{
  notificationId?: string | null;
}>;

export class NotificationValidationError extends Error {
  readonly field: string | undefined;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "NotificationValidationError";
    this.field = field;
  }
}

export class NotificationNotFoundError extends Error {
  constructor(message = "Notification not found.") {
    super(message);
    this.name = "NotificationNotFoundError";
  }
}

export class NotificationStoreError extends Error {
  constructor(message = "The notification could not be loaded or saved.") {
    super(message);
    this.name = "NotificationStoreError";
  }
}

export interface NotificationRepository {
  list(
    actorUserId: string,
    workspaceId: string,
    unreadOnly?: boolean
  ): Promise<readonly Notification[]>;
  unreadCount(actorUserId: string, workspaceId: string): Promise<number>;
  markRead(
    actorUserId: string,
    workspaceId: string,
    notificationId?: string | null
  ): Promise<number>;
  create(
    actorUserId: string,
    workspaceId: string,
    input: CreateNotificationInput
  ): Promise<Notification>;
}

export function parseCreateNotificationInput(value: unknown): CreateNotificationInput {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["recipientUserId", "type", "title", "message", "targetType", "targetId"])
  ) {
    throw new NotificationValidationError("The create notification request is invalid.");
  }
  const recipientUserId = normalizeId(
    value["recipientUserId"],
    "recipientUserId",
    "Invalid recipient user ID."
  );
  const type = normalizeNotificationType(value["type"]);
  const title = sanitizeString(value["title"], "title", 1, 200, "Enter notification title.");
  const message = sanitizeString(
    value["message"],
    "message",
    1,
    1000,
    "Enter notification message."
  );
  const targetType = normalizeTargetType(value["targetType"]);
  const targetId = normalizeId(value["targetId"], "targetId", "Invalid target identifier.");

  return Object.freeze({
    recipientUserId,
    type,
    title,
    message,
    targetType,
    targetId
  });
}

export function parseMarkNotificationReadInput(value: unknown): MarkNotificationReadInput {
  if (value === undefined || value === null) return Object.freeze({ notificationId: null });
  if (!isRecord(value) || !hasOnlyKeys(value, ["notificationId"])) {
    throw new NotificationValidationError("The mark read request is invalid.");
  }
  if (value["notificationId"] === null || value["notificationId"] === undefined) {
    return Object.freeze({ notificationId: null });
  }
  const notificationId = normalizeId(
    value["notificationId"],
    "notificationId",
    "Invalid notification ID."
  );
  return Object.freeze({ notificationId });
}

export function normalizeNotificationId(value: unknown): string {
  return normalizeId(value, "notificationId", "Invalid notification ID.");
}

function normalizeNotificationType(value: unknown): NotificationType {
  if (typeof value !== "string" || !notificationTypes.includes(value as NotificationType)) {
    throw new NotificationValidationError("Choose a valid notification type.", "type");
  }
  return value as NotificationType;
}

function normalizeTargetType(value: unknown): "demo" | "step" | "workspace" | "comment" {
  if (typeof value !== "string" || !["demo", "step", "workspace", "comment"].includes(value)) {
    throw new NotificationValidationError("Choose a valid target type.", "targetType");
  }
  return value as "demo" | "step" | "workspace" | "comment";
}

function sanitizeString(
  value: unknown,
  field: string,
  min: number,
  max: number,
  emptyMsg: string
): string {
  if (typeof value !== "string") {
    throw new NotificationValidationError(emptyMsg, field);
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new NotificationValidationError(
      `Field must be between ${min} and ${max} characters.`,
      field
    );
  }
  return trimmed;
}

function normalizeId(value: unknown, field: string, message: string): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)
  ) {
    throw new NotificationValidationError(message, field);
  }
  return value.toLowerCase();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length <= allowed.length && keys.every((key) => allowed.includes(key));
}
