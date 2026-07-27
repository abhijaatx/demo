export const commentTargetTypes = ["demo", "step"] as const;
export type CommentTargetType = (typeof commentTargetTypes)[number];

export type CommentReaction = Readonly<{
  emoji: string;
  userIds: readonly string[];
}>;

export type Comment = Readonly<{
  id: string;
  workspaceId: string;
  targetType: CommentTargetType;
  targetId: string;
  threadId: string;
  parentId: string | null;
  authorUserId: string;
  content: string;
  mentions: readonly string[];
  reactions: readonly CommentReaction[];
  isResolved: boolean;
  resolvedByUserId: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}>;

export type CreateCommentInput = Readonly<{
  targetType: CommentTargetType;
  targetId: string;
  content: string;
  parentId?: string | null;
  mentions?: readonly string[];
}>;

export type UpdateCommentInput = Readonly<{
  content: string;
}>;

export type ToggleResolveCommentInput = Readonly<{
  isResolved: boolean;
}>;

export type ToggleCommentReactionInput = Readonly<{
  emoji: string;
}>;

export class CommentValidationError extends Error {
  readonly field: string | undefined;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "CommentValidationError";
    this.field = field;
  }
}

export class CommentNotFoundError extends Error {
  constructor(message = "Comment not found.") {
    super(message);
    this.name = "CommentNotFoundError";
  }
}

export class CommentStoreError extends Error {
  constructor(message = "The comment could not be loaded or saved.") {
    super(message);
    this.name = "CommentStoreError";
  }
}

export interface CommentRepository {
  list(
    actorUserId: string,
    workspaceId: string,
    targetType: CommentTargetType,
    targetId: string
  ): Promise<readonly Comment[]>;
  create(
    actorUserId: string,
    workspaceId: string,
    input: CreateCommentInput,
    idempotencyKey?: string
  ): Promise<Comment>;
  update(
    actorUserId: string,
    workspaceId: string,
    commentId: string,
    input: UpdateCommentInput
  ): Promise<Comment | null>;
  delete(actorUserId: string, workspaceId: string, commentId: string): Promise<boolean>;
  toggleResolve(
    actorUserId: string,
    workspaceId: string,
    commentId: string,
    isResolved: boolean
  ): Promise<Comment | null>;
  toggleReaction(
    actorUserId: string,
    workspaceId: string,
    commentId: string,
    emoji: string
  ): Promise<Comment | null>;
}

export function parseCreateCommentInput(value: unknown): CreateCommentInput {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["targetType", "targetId", "content", "parentId", "mentions"])
  ) {
    throw new CommentValidationError("The create comment request is invalid.");
  }
  const targetType = normalizeCommentTargetType(value["targetType"]);
  const targetId = normalizeId(value["targetId"], "targetId", "The target identifier is invalid.");
  const content = sanitizeCommentContent(value["content"]);
  const parentId =
    value["parentId"] !== undefined && value["parentId"] !== null
      ? normalizeId(value["parentId"], "parentId", "The parent comment identifier is invalid.")
      : null;
  const mentions = parseMentions(value["mentions"]);

  return Object.freeze({
    targetType,
    targetId,
    content,
    parentId,
    mentions
  });
}

export function parseUpdateCommentInput(value: unknown): UpdateCommentInput {
  if (!isRecord(value) || !hasOnlyKeys(value, ["content"])) {
    throw new CommentValidationError("The update comment request is invalid.");
  }
  return Object.freeze({
    content: sanitizeCommentContent(value["content"])
  });
}

export function parseToggleResolveCommentInput(value: unknown): ToggleResolveCommentInput {
  if (!isRecord(value) || !hasOnlyKeys(value, ["isResolved"])) {
    throw new CommentValidationError("The resolve comment request is invalid.");
  }
  if (typeof value["isResolved"] !== "boolean") {
    throw new CommentValidationError("The isResolved field must be a boolean.", "isResolved");
  }
  return Object.freeze({ isResolved: value["isResolved"] });
}

export function parseToggleCommentReactionInput(value: unknown): ToggleCommentReactionInput {
  if (!isRecord(value) || !hasOnlyKeys(value, ["emoji"])) {
    throw new CommentValidationError("The reaction request is invalid.");
  }
  const emoji = sanitizeEmoji(value["emoji"]);
  return Object.freeze({ emoji });
}

export function normalizeCommentId(value: unknown): string {
  return normalizeId(value, "commentId", "The comment identifier is invalid.");
}

function normalizeCommentTargetType(value: unknown): CommentTargetType {
  if (typeof value !== "string" || !commentTargetTypes.includes(value as CommentTargetType)) {
    throw new CommentValidationError("Choose an allowed comment target type.", "targetType");
  }
  return value as CommentTargetType;
}

function sanitizeCommentContent(value: unknown): string {
  if (typeof value !== "string") {
    throw new CommentValidationError("Enter comment content.", "content");
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 2_000) {
    throw new CommentValidationError(
      "Comment content must be between 1 and 2,000 characters.",
      "content"
    );
  }
  // Sanitize control characters except newlines/tabs
  const sanitized = Array.from(trimmed)
    .filter((char) => {
      const code = char.charCodeAt(0);
      return code >= 32 || code === 10 || code === 13 || code === 9;
    })
    .join("");
  if (sanitized.length === 0) {
    throw new CommentValidationError("Comment content contains invalid characters.", "content");
  }
  return sanitized;
}

function sanitizeEmoji(value: unknown): string {
  if (typeof value !== "string") {
    throw new CommentValidationError("Provide an emoji reaction.", "emoji");
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > 16) {
    throw new CommentValidationError(
      "Emoji reactions must be between 1 and 16 characters.",
      "emoji"
    );
  }
  return trimmed;
}

function parseMentions(value: unknown): readonly string[] {
  if (value === undefined || value === null) return Object.freeze([]);
  if (!Array.isArray(value)) {
    throw new CommentValidationError("Mentions must be an array of user IDs.", "mentions");
  }
  if (value.length > 10) {
    throw new CommentValidationError("A comment can mention at most 10 users.", "mentions");
  }
  const result: string[] = [];
  for (const item of value) {
    const id = normalizeId(item, "mentions", "Mentioned user ID is invalid.");
    if (!result.includes(id)) result.push(id);
  }
  return Object.freeze(result);
}

function normalizeId(value: unknown, field: string, message: string): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)
  ) {
    throw new CommentValidationError(message, field);
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
