import { normalizeUserId } from "./workspace.js";

export const maxFolderDepth = 10 as const;

export type Folder = Readonly<{
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateFolderInput = Readonly<{
  name: string;
  parentId: string | null;
}>;

export type UpdateFolderInput = Readonly<{
  name: string;
  expectedVersion: number;
}>;

export type MoveFolderInput = Readonly<{
  parentId: string | null;
  expectedVersion: number;
}>;

export type AssignDemoFolderInput = Readonly<{
  folderId: string | null;
}>;

export class FolderValidationError extends Error {
  readonly field?: string;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "FolderValidationError";
    if (field !== undefined) this.field = field;
  }
}

export class FolderConflictError extends Error {
  constructor(message = "That folder has changed. Refresh and try again.") {
    super(message);
    this.name = "FolderConflictError";
  }
}

export class FolderStoreError extends Error {
  constructor() {
    super("Folders could not be loaded or saved.");
    this.name = "FolderStoreError";
  }
}

export interface FolderRepository {
  list(actorUserId: string, workspaceId: string): Promise<readonly Folder[]>;
  create(
    actorUserId: string,
    workspaceId: string,
    input: CreateFolderInput,
    idempotencyKey: string
  ): Promise<Folder>;
  update(
    actorUserId: string,
    workspaceId: string,
    folderId: string,
    input: UpdateFolderInput
  ): Promise<Folder | null>;
  move(
    actorUserId: string,
    workspaceId: string,
    folderId: string,
    input: MoveFolderInput
  ): Promise<Folder | null>;
  delete(
    actorUserId: string,
    workspaceId: string,
    folderId: string,
    expectedVersion: number
  ): Promise<boolean>;
}

export function parseCreateFolderInput(value: unknown): CreateFolderInput {
  if (!isRecord(value) || !hasOnlyKeys(value, ["name", "parentId"])) {
    throw new FolderValidationError("The folder request is invalid.");
  }
  return Object.freeze({
    name: normalizeFolderName(value["name"]),
    parentId: normalizeNullableFolderId(value["parentId"], "parentId")
  });
}

export function parseUpdateFolderInput(value: unknown): UpdateFolderInput {
  if (!isRecord(value) || !hasOnlyKeys(value, ["name", "expectedVersion"])) {
    throw new FolderValidationError("The folder request is invalid.");
  }
  return Object.freeze({
    name: normalizeFolderName(value["name"]),
    expectedVersion: normalizeFolderVersion(value["expectedVersion"])
  });
}

export function parseMoveFolderInput(value: unknown): MoveFolderInput {
  if (!isRecord(value) || !hasOnlyKeys(value, ["parentId", "expectedVersion"])) {
    throw new FolderValidationError("The folder request is invalid.");
  }
  return Object.freeze({
    parentId: normalizeNullableFolderId(value["parentId"], "parentId"),
    expectedVersion: normalizeFolderVersion(value["expectedVersion"])
  });
}

export function parseAssignDemoFolderInput(value: unknown): AssignDemoFolderInput {
  if (!isRecord(value) || !hasOnlyKeys(value, ["folderId"])) {
    throw new FolderValidationError("The folder request is invalid.");
  }
  return Object.freeze({ folderId: normalizeNullableFolderId(value["folderId"], "folderId") });
}

export function normalizeFolderId(value: unknown): string {
  try {
    return normalizeUserId(value);
  } catch {
    throw new FolderValidationError("The folder identifier is invalid.", "folderId");
  }
}

export function normalizeFolderVersion(value: unknown): number {
  if (!Number.isSafeInteger(value) || (value as number) < 1 || (value as number) > 2_147_483_647) {
    throw new FolderValidationError("The folder version is invalid.", "expectedVersion");
  }
  return value as number;
}

export function folderFingerprint(input: CreateFolderInput): string {
  return JSON.stringify({ name: input.name, parentId: input.parentId });
}

function normalizeFolderName(value: unknown): string {
  if (typeof value !== "string") throw new FolderValidationError("Enter a folder name.", "name");
  const name = value.trim();
  if (
    name.length === 0 ||
    name.length > 120 ||
    Array.from(name).some((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127;
    })
  ) {
    throw new FolderValidationError("Enter a valid folder name.", "name");
  }
  return name;
}

function normalizeNullableFolderId(value: unknown, field: string): string | null {
  if (value === null) return null;
  try {
    return normalizeUserId(value);
  } catch {
    throw new FolderValidationError("The folder identifier is invalid.", field);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, allowed: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === allowed.length && keys.every((key) => allowed.includes(key));
}
