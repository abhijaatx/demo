import { demoStatuses, demoTypes, type DemoStatus, type DemoType } from "./demo.js";
import { normalizeUserId } from "./workspace.js";

export type Tag = Readonly<{
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateTagInput = Readonly<{ name: string }>;
export type DemoSearchFilters = Readonly<{
  query: string | null;
  ownerUserId: string | null;
  type: DemoType | null;
  status: DemoStatus | null;
  tagIds: readonly string[];
  updatedAfter: string | null;
  updatedBefore: string | null;
}>;

export class TagValidationError extends Error {
  readonly field?: string;
  constructor(message: string, field?: string) {
    super(message);
    this.name = "TagValidationError";
    if (field !== undefined) this.field = field;
  }
}

export class TagConflictError extends Error {
  constructor(message = "That tag already exists or has changed.") {
    super(message);
    this.name = "TagConflictError";
  }
}

export class TagStoreError extends Error {
  constructor() {
    super("Tags could not be loaded or saved.");
    this.name = "TagStoreError";
  }
}

export interface TagRepository {
  list(actorUserId: string, workspaceId: string): Promise<readonly Tag[]>;
  create(
    actorUserId: string,
    workspaceId: string,
    input: CreateTagInput,
    idempotencyKey: string
  ): Promise<Tag>;
  assignToDemo(
    actorUserId: string,
    workspaceId: string,
    demoId: string,
    tagId: string
  ): Promise<void>;
  removeFromDemo(
    actorUserId: string,
    workspaceId: string,
    demoId: string,
    tagId: string
  ): Promise<boolean>;
}

export function parseCreateTagInput(value: unknown): CreateTagInput {
  if (!isRecord(value) || !hasOnlyKeys(value, ["name"]))
    throw new TagValidationError("The tag request is invalid.");
  return Object.freeze({ name: normalizeTagName(value["name"]) });
}

export function parseDemoSearchFilters(
  value: Readonly<Record<string, string | undefined>>
): DemoSearchFilters {
  const allowed = new Set(["q", "owner", "type", "status", "tag", "updatedAfter", "updatedBefore"]);
  for (const key of Object.keys(value))
    if (!allowed.has(key)) throw new TagValidationError("The demo search is invalid.");
  const query = normalizeOptionalText(value["q"], "q", 200);
  const ownerUserId = value["owner"] ? normalizeTagId(value["owner"], "owner") : null;
  const type = value["type"] ? normalizeDemoType(value["type"]) : null;
  const status = value["status"] ? normalizeDemoStatus(value["status"]) : null;
  const tagIds = value["tag"] ? parseTagList(value["tag"]!) : [];
  const updatedAfter = normalizeDate(value["updatedAfter"], "updatedAfter");
  const updatedBefore = normalizeDate(value["updatedBefore"], "updatedBefore");
  if (updatedAfter && updatedBefore && updatedAfter > updatedBefore) {
    throw new TagValidationError("The date range is invalid.", "updatedBefore");
  }
  return Object.freeze({
    query,
    ownerUserId,
    type,
    status,
    tagIds: Object.freeze(tagIds),
    updatedAfter,
    updatedBefore
  });
}

export function normalizeTagId(value: unknown, field = "tagId"): string {
  try {
    return normalizeUserId(value);
  } catch {
    throw new TagValidationError("The tag identifier is invalid.", field);
  }
}

export function tagFingerprint(input: CreateTagInput): string {
  return JSON.stringify({ name: input.name });
}

function normalizeTagName(value: unknown): string {
  const name = normalizeOptionalText(value, "name", 80);
  if (!name) throw new TagValidationError("Enter a tag name.", "name");
  return name;
}

function normalizeOptionalText(
  value: unknown,
  field: string,
  maximumLength: number
): string | null {
  if (value === undefined) return null;
  if (typeof value !== "string") throw new TagValidationError("The tag request is invalid.", field);
  const text = value.trim();
  if (
    text.length > maximumLength ||
    Array.from(text).some(
      (character) => character.charCodeAt(0) <= 31 || character.charCodeAt(0) === 127
    )
  ) {
    throw new TagValidationError("Enter a valid value.", field);
  }
  return text || null;
}

function normalizeDemoType(value: unknown): DemoType {
  if (typeof value !== "string" || !demoTypes.includes(value as DemoType))
    throw new TagValidationError("The demo type is invalid.", "type");
  return value as DemoType;
}

function normalizeDemoStatus(value: unknown): DemoStatus {
  if (typeof value !== "string" || !demoStatuses.includes(value as DemoStatus))
    throw new TagValidationError("The demo status is invalid.", "status");
  return value as DemoStatus;
}

function parseTagList(value: string): readonly string[] {
  const values = value.split(",").filter(Boolean);
  if (values.length === 0 || values.length > 10)
    throw new TagValidationError("Choose up to 10 tags.", "tag");
  const ids = values.map((id) => normalizeTagId(id, "tag"));
  if (new Set(ids).size !== ids.length)
    throw new TagValidationError("Choose each tag only once.", "tag");
  return ids;
}

function normalizeDate(value: string | undefined, field: string): string | null {
  if (value === undefined) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/u.test(value) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new TagValidationError("Use a valid date.", field);
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
