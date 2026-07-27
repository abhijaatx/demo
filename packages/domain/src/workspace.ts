import type { WorkspaceCapability } from "./authorization.js";

export type WorkspaceRole = "owner" | "admin" | "editor" | "viewer";

export type CreateWorkspaceInput = Readonly<{
  organizationName: string;
  workspaceName: string;
  slug: string;
}>;

export type WorkspaceSummary = Readonly<{
  organizationId: string;
  organizationName: string;
  workspaceId: string;
  workspaceName: string;
  slug: string;
  role: WorkspaceRole;
  capabilities: readonly WorkspaceCapability[];
  createdAt: string;
}>;

export class WorkspaceValidationError extends Error {
  readonly field: string | undefined;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "WorkspaceValidationError";
    this.field = field;
  }
}

export class WorkspaceConflictError extends Error {
  constructor() {
    super("The workspace could not be created with the requested values.");
    this.name = "WorkspaceConflictError";
  }
}

export class WorkspaceStoreError extends Error {
  constructor() {
    super("The workspace could not be loaded or saved.");
    this.name = "WorkspaceStoreError";
  }
}

export interface WorkspaceRepository {
  createForUser(
    userId: string,
    input: CreateWorkspaceInput,
    idempotencyKey: string
  ): Promise<WorkspaceSummary>;
  listForUser(userId: string): Promise<readonly WorkspaceSummary[]>;
  getCurrentForUser(userId: string): Promise<WorkspaceSummary | null>;
  setCurrentForUser(userId: string, workspaceId: string): Promise<WorkspaceSummary | null>;
}

export function normalizeUserId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(value)
  ) {
    throw new WorkspaceValidationError("The user identity is invalid.", "userId");
  }
  return value.toLowerCase();
}

export function normalizeOrganizationName(value: unknown): string {
  return normalizeName(value, "organizationName", "Enter an organization name.");
}

export function normalizeWorkspaceName(value: unknown): string {
  return normalizeName(value, "workspaceName", "Enter a workspace name.");
}

export function normalizeWorkspaceSlug(value: unknown): string {
  if (typeof value !== "string") {
    throw new WorkspaceValidationError("Enter a workspace slug.", "slug");
  }
  const slug = value.trim().toLowerCase();
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/u.test(slug)) {
    throw new WorkspaceValidationError(
      "Use 1 to 63 lowercase letters, numbers, or single hyphens.",
      "slug"
    );
  }
  return slug;
}

export function normalizeIdempotencyKey(value: unknown): string {
  if (typeof value !== "string") {
    throw new WorkspaceValidationError("A valid idempotency key is required.");
  }
  const key = value.trim();
  if (key.length < 1 || key.length > 128 || hasControlCharacters(key)) {
    throw new WorkspaceValidationError("A valid idempotency key is required.");
  }
  return key;
}

export function parseCreateWorkspaceInput(value: unknown): CreateWorkspaceInput {
  if (!isRecord(value)) {
    throw new WorkspaceValidationError("The workspace request is invalid.");
  }
  const allowedKeys = new Set(["organizationName", "workspaceName", "slug"]);
  const keys = Object.keys(value);
  if (keys.length !== allowedKeys.size || keys.some((key) => !allowedKeys.has(key))) {
    throw new WorkspaceValidationError("The workspace request is invalid.");
  }
  return Object.freeze({
    organizationName: normalizeOrganizationName(value["organizationName"]),
    workspaceName: normalizeWorkspaceName(value["workspaceName"]),
    slug: normalizeWorkspaceSlug(value["slug"])
  });
}

export function workspaceFingerprint(input: CreateWorkspaceInput): string {
  return JSON.stringify({
    organizationName: input.organizationName,
    workspaceName: input.workspaceName,
    slug: input.slug
  });
}

function normalizeName(value: unknown, field: string, message: string): string {
  if (typeof value !== "string") {
    throw new WorkspaceValidationError(message, field);
  }
  const name = value.trim();
  if (name.length < 1 || name.length > 200 || hasControlCharacters(name)) {
    throw new WorkspaceValidationError("Names must be from 1 to 200 characters.", field);
  }
  return name;
}

function hasControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
