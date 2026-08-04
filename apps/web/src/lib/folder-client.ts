import { apiBaseUrl } from "./api-client";
import { readCsrfToken } from "./csrf";

export type Folder = Readonly<{
  id: string;
  workspaceId: string;
  parentId: string | null;
  name: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}>;

export type CreateFolderInput = Readonly<{ name: string; parentId: string | null }>;

export class FolderClientError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(
      status === 401
        ? "Sign in to view folders."
        : status === 403
          ? "You don’t have permission to manage folders in this workspace."
          : status === 409
            ? "This folder changed elsewhere. Refresh and try again."
            : "Folders could not be loaded. Try again."
    );
    this.name = "FolderClientError";
    this.status = status;
  }
}

export interface FolderClient {
  list(workspaceId: string): Promise<readonly Folder[]>;
  create(workspaceId: string, input: CreateFolderInput): Promise<Folder>;
  update(
    workspaceId: string,
    folderId: string,
    name: string,
    expectedVersion: number
  ): Promise<Folder>;
  move(
    workspaceId: string,
    folderId: string,
    parentId: string | null,
    expectedVersion: number
  ): Promise<Folder>;
  delete(workspaceId: string, folderId: string, expectedVersion: number): Promise<void>;
  assignDemo(workspaceId: string, demoId: string, folderId: string | null): Promise<void>;
}

export function createFolderClient(fetcher: typeof fetch = fetch): FolderClient {
  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    let response: Response;
    try {
      response = await fetcher(`${apiBaseUrl}${path}`, {
        ...init,
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...(init.method && init.method !== "GET" && readCsrfToken()
            ? { "X-CSRF-Token": readCsrfToken() }
            : {}),
          ...init.headers
        }
      });
    } catch {
      throw new FolderClientError(0);
    }
    if (!response.ok) throw new FolderClientError(response.status);
    try {
      return (await response.json()) as T;
    } catch {
      throw new FolderClientError(502);
    }
  };

  return {
    async list(workspaceId) {
      const value: unknown = await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/folders`
      );
      if (!Array.isArray(value) || !value.every(isFolder)) throw new FolderClientError(502);
      return value;
    },
    async create(workspaceId, input) {
      const value: unknown = await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/folders`,
        {
          method: "POST",
          headers: { "Idempotency-Key": `folder-${globalThis.crypto.randomUUID()}` },
          body: JSON.stringify(input)
        }
      );
      if (!isFolder(value)) throw new FolderClientError(502);
      return value;
    },
    async move(workspaceId, folderId, parentId, expectedVersion) {
      const value: unknown = await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/folders/${encodeURIComponent(folderId)}/move`,
        {
          method: "POST",
          body: JSON.stringify({ parentId, expectedVersion })
        }
      );
      if (!isFolder(value)) throw new FolderClientError(502);
      return value;
    },
    async update(workspaceId, folderId, name, expectedVersion) {
      const value: unknown = await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/folders/${encodeURIComponent(folderId)}`,
        { method: "PATCH", body: JSON.stringify({ name, expectedVersion }) }
      );
      if (!isFolder(value)) throw new FolderClientError(502);
      return value;
    },
    async delete(workspaceId, folderId, expectedVersion) {
      await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/folders/${encodeURIComponent(folderId)}`,
        { method: "DELETE", body: JSON.stringify({ expectedVersion }) }
      );
    },
    async assignDemo(workspaceId, demoId, folderId) {
      await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/demos/${encodeURIComponent(demoId)}/folder`,
        { method: "POST", body: JSON.stringify({ folderId }) }
      );
    }
  };
}

function isFolder(value: unknown): value is Folder {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const folder = value as Record<string, unknown>;
  return (
    typeof folder["id"] === "string" &&
    typeof folder["workspaceId"] === "string" &&
    (folder["parentId"] === null || typeof folder["parentId"] === "string") &&
    typeof folder["name"] === "string" &&
    Number.isSafeInteger(folder["version"]) &&
    (folder["version"] as number) > 0 &&
    typeof folder["createdAt"] === "string" &&
    typeof folder["updatedAt"] === "string"
  );
}
