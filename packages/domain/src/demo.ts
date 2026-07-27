export const demoTypes = ["guided_html", "screenshot", "video", "sandbox"] as const;
export type DemoType = (typeof demoTypes)[number];

export const demoStatuses = [
  "draft",
  "processing",
  "published",
  "failed",
  "needs_update",
  "archived"
] as const;
export type DemoStatus = (typeof demoStatuses)[number];

export type Demo = Readonly<{
  id: string;
  workspaceId: string;
  folderId: string | null;
  ownerUserId: string;
  title: string;
  description: string | null;
  type: DemoType;
  status: DemoStatus;
  isTemplate: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}>;

export type CreateDemoInput = Readonly<{
  title: string;
  description: string | null;
  type: DemoType;
}>;

export type DuplicateDemoInput = Readonly<{
  title?: string;
  folderId?: string | null;
}>;

export type CreateFromTemplateInput = Readonly<{
  title?: string;
  folderId?: string | null;
}>;

export type SetDemoTemplateInput = Readonly<{
  isTemplate: boolean;
}>;

export type DemoPatch = Readonly<{
  title?: string;
  description?: string | null;
  type?: DemoType;
}>;

export const TRASH_RETENTION_DAYS = 30;

export type TrashItem = Readonly<{
  demo: Demo;
  deletedAt: string;
  expiresAt: string;
  daysRemaining: number;
}>;

export function calculateTrashRetention(
  deletedAtIso: string,
  now = new Date(),
  retentionDays = TRASH_RETENTION_DAYS
): Readonly<{ expiresAt: string; daysRemaining: number }> {
  const deletedAtDate = new Date(deletedAtIso);
  if (Number.isNaN(deletedAtDate.getTime())) {
    throw new DemoValidationError("The deletedAt date is invalid.");
  }
  const expiresAtDate = new Date(deletedAtDate.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  const diffMs = expiresAtDate.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (24 * 60 * 60 * 1000)));
  return Object.freeze({
    expiresAt: expiresAtDate.toISOString(),
    daysRemaining
  });
}

export type DemoAuditAction =
  | "demo.created"
  | "demo.updated"
  | "demo.status_changed"
  | "demo.deleted"
  | "demo.restored"
  | "demo.archived"
  | "demo.unarchived"
  | "demo.permanently_deleted"
  | "demo.duplicated"
  | "demo.template_designated"
  | "demo.template_created";

export type DemoAuditEvent = Readonly<{
  id: string;
  workspaceId: string;
  demoId: string | null;
  actorUserId: string;
  action: DemoAuditAction;
  previousStatus: DemoStatus | null;
  status: DemoStatus | null;
  createdAt: string;
}>;

export class DemoValidationError extends Error {
  readonly field: string | undefined;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "DemoValidationError";
    this.field = field;
  }
}

export class DemoConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DemoConflictError";
  }
}

export class DemoNotFoundError extends Error {
  constructor(message = "Demo not found.") {
    super(message);
    this.name = "DemoNotFoundError";
  }
}

export class DemoStoreError extends Error {
  constructor(message = "The demo could not be loaded or saved.") {
    super(message);
    this.name = "DemoStoreError";
  }
}

export interface DemoRepository {
  list(
    actorUserId: string,
    workspaceId: string,
    filters?: import("./tag.js").DemoSearchFilters
  ): Promise<readonly Demo[]>;
  listTrash(actorUserId: string, workspaceId: string): Promise<readonly TrashItem[]>;
  get(actorUserId: string, workspaceId: string, demoId: string): Promise<Demo | null>;
  create(
    actorUserId: string,
    workspaceId: string,
    input: CreateDemoInput,
    idempotencyKey: string
  ): Promise<Demo>;
  update(
    actorUserId: string,
    workspaceId: string,
    demoId: string,
    patch: DemoPatch
  ): Promise<Demo | null>;
  transitionStatus(
    actorUserId: string,
    workspaceId: string,
    demoId: string,
    status: DemoStatus
  ): Promise<Demo | null>;
  archive(actorUserId: string, workspaceId: string, demoId: string): Promise<Demo | null>;
  unarchive(actorUserId: string, workspaceId: string, demoId: string): Promise<Demo | null>;
  softDelete(actorUserId: string, workspaceId: string, demoId: string): Promise<boolean>;
  restore(actorUserId: string, workspaceId: string, demoId: string): Promise<Demo | null>;
  permanentDelete(actorUserId: string, workspaceId: string, demoId: string): Promise<boolean>;
  purgeExpiredTrash(
    retentionDays?: number
  ): Promise<readonly { workspaceId: string; demoId: string }[]>;
  assignFolder(
    actorUserId: string,
    workspaceId: string,
    demoId: string,
    folderId: string | null
  ): Promise<Demo | null>;
  duplicate(
    actorUserId: string,
    workspaceId: string,
    demoId: string,
    input?: DuplicateDemoInput,
    idempotencyKey?: string
  ): Promise<Demo | null>;
  setTemplate(
    actorUserId: string,
    workspaceId: string,
    demoId: string,
    isTemplate: boolean
  ): Promise<Demo | null>;
  createFromTemplate(
    actorUserId: string,
    workspaceId: string,
    templateDemoId: string,
    input?: CreateFromTemplateInput,
    idempotencyKey?: string
  ): Promise<Demo | null>;
}

const allowedTransitions: Readonly<Record<DemoStatus, readonly DemoStatus[]>> = {
  draft: ["processing", "published", "archived"],
  processing: ["draft", "published", "failed", "archived"],
  published: ["draft", "needs_update", "archived"],
  failed: ["draft", "processing", "archived"],
  needs_update: ["draft", "published", "archived"],
  archived: ["draft"]
};

export function parseCreateDemoInput(value: unknown): CreateDemoInput {
  if (!isRecord(value) || !hasOnlyKeys(value, ["title", "description", "type"])) {
    throw new DemoValidationError("The demo request is invalid.");
  }
  return Object.freeze({
    title: normalizeDemoTitle(value["title"]),
    description: normalizeDemoDescription(value["description"]),
    type: normalizeDemoType(value["type"])
  });
}

export function parseDuplicateDemoInput(value: unknown): DuplicateDemoInput {
  if (value === undefined || value === null) return Object.freeze({});
  if (!isRecord(value) || !hasOnlyKeys(value, ["title", "folderId"])) {
    throw new DemoValidationError("The duplicate demo request is invalid.");
  }
  const result: { title?: string; folderId?: string | null } = {};
  if ("title" in value && value["title"] !== undefined && value["title"] !== null) {
    result.title = normalizeDemoTitle(value["title"]);
  }
  if ("folderId" in value && value["folderId"] !== undefined) {
    result.folderId = value["folderId"] === null ? null : normalizeFolderId(value["folderId"]);
  }
  return Object.freeze(result);
}

export function parseCreateFromTemplateInput(value: unknown): CreateFromTemplateInput {
  if (value === undefined || value === null) return Object.freeze({});
  if (!isRecord(value) || !hasOnlyKeys(value, ["title", "folderId"])) {
    throw new DemoValidationError("The template instantiation request is invalid.");
  }
  const result: { title?: string; folderId?: string | null } = {};
  if ("title" in value && value["title"] !== undefined && value["title"] !== null) {
    result.title = normalizeDemoTitle(value["title"]);
  }
  if ("folderId" in value && value["folderId"] !== undefined) {
    result.folderId = value["folderId"] === null ? null : normalizeFolderId(value["folderId"]);
  }
  return Object.freeze(result);
}

export function parseSetDemoTemplateInput(value: unknown): SetDemoTemplateInput {
  if (!isRecord(value) || !hasOnlyKeys(value, ["isTemplate"])) {
    throw new DemoValidationError("The template setting request is invalid.");
  }
  if (typeof value["isTemplate"] !== "boolean") {
    throw new DemoValidationError("The isTemplate value must be a boolean.", "isTemplate");
  }
  return Object.freeze({ isTemplate: value["isTemplate"] });
}

export function parseDemoPatch(value: unknown): DemoPatch {
  if (!isRecord(value) || !hasOnlyKeys(value, ["title", "description", "type"])) {
    throw new DemoValidationError("The demo update is invalid.");
  }
  const keys = Object.keys(value);
  if (keys.length === 0) throw new DemoValidationError("The demo update is invalid.");
  const patch: { title?: string; description?: string | null; type?: DemoType } = {};
  if ("title" in value) patch.title = normalizeDemoTitle(value["title"]);
  if ("description" in value) patch.description = normalizeDemoDescription(value["description"]);
  if ("type" in value) patch.type = normalizeDemoType(value["type"]);
  return Object.freeze(patch);
}

export function normalizeDemoStatus(value: unknown): DemoStatus {
  if (typeof value !== "string" || !demoStatuses.includes(value as DemoStatus)) {
    throw new DemoValidationError("Choose an allowed demo status.", "status");
  }
  return value as DemoStatus;
}

export function assertDemoStatusTransition(current: DemoStatus, next: DemoStatus): void {
  if (!allowedTransitions[current].includes(next)) {
    throw new DemoConflictError("That demo status transition is not allowed.");
  }
}

export function normalizeDemoId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)
  ) {
    throw new DemoValidationError("The demo identifier is invalid.", "demoId");
  }
  return value.toLowerCase();
}

function normalizeFolderId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)
  ) {
    throw new DemoValidationError("The folder identifier is invalid.", "folderId");
  }
  return value.toLowerCase();
}

export function demoFingerprint(input: CreateDemoInput): string {
  return JSON.stringify({
    title: input.title,
    description: input.description,
    type: input.type
  });
}

function normalizeDemoTitle(value: unknown): string {
  return normalizeText(value, "title", "Enter a demo title.", 200, false) as string;
}

function normalizeDemoDescription(value: unknown): string | null {
  return normalizeText(value, "description", "Enter a valid description.", 4_000, true);
}

function normalizeDemoType(value: unknown): DemoType {
  if (typeof value !== "string" || !demoTypes.includes(value as DemoType)) {
    throw new DemoValidationError("Choose an allowed demo type.", "type");
  }
  return value as DemoType;
}

function normalizeText(
  value: unknown,
  field: string,
  message: string,
  maximumLength: number,
  nullable: boolean
): string | null {
  if (nullable && value === null) return null;
  if (typeof value !== "string") throw new DemoValidationError(message, field);
  const text = value.trim();
  if (
    (!nullable && text.length === 0) ||
    text.length > maximumLength ||
    Array.from(text).some((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127;
    })
  ) {
    throw new DemoValidationError(message, field);
  }
  return text.length === 0 && nullable ? null : text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length <= allowed.length && keys.every((key) => allowed.includes(key));
}
