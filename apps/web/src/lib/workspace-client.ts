import { apiBaseUrl } from "./api-client";
import { readCsrfToken } from "./csrf";

export type WorkspaceCapability = string;

export type WorkspaceSummary = Readonly<{
  organizationId: string;
  organizationName: string;
  workspaceId: string;
  workspaceName: string;
  slug: string;
  role: "owner" | "admin" | "editor" | "viewer";
  capabilities: readonly WorkspaceCapability[];
  createdAt: string;
}>;

export type CreateWorkspaceInput = Readonly<{
  organizationName: string;
  workspaceName: string;
  slug: string;
}>;

export class WorkspaceClientError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(status === 401 ? "Sign in to choose a workspace." : "Workspaces could not be loaded.");
    this.name = "WorkspaceClientError";
    this.status = status;
  }
}

export interface WorkspaceClient {
  list(): Promise<readonly WorkspaceSummary[]>;
  getCurrent(): Promise<WorkspaceSummary>;
  setCurrent(workspaceId: string): Promise<WorkspaceSummary>;
  create(input: CreateWorkspaceInput): Promise<WorkspaceSummary>;
}

export function createWorkspaceClient(fetcher: typeof fetch = fetch): WorkspaceClient {
  const request = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
    const response = await fetcher(`${apiBaseUrl}${path}`, {
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
    if (!response.ok) throw new WorkspaceClientError(response.status);
    return (await response.json()) as T;
  };

  return {
    list: async () => {
      const value: unknown = await request("/workspaces");
      if (!Array.isArray(value) || !value.every(isWorkspaceSummary)) {
        throw new WorkspaceClientError(502);
      }
      return value;
    },
    getCurrent: async () => {
      const value: unknown = await request("/workspaces/current");
      if (!isWorkspaceSummary(value)) throw new WorkspaceClientError(502);
      return value;
    },
    setCurrent: async (workspaceId) => {
      const value: unknown = await request("/workspaces/current", {
        method: "PUT",
        body: JSON.stringify({ workspaceId })
      });
      if (!isWorkspaceSummary(value)) throw new WorkspaceClientError(502);
      return value;
    },
    create: async (input) => {
      const value: unknown = await request("/workspaces", {
        method: "POST",
        headers: { "Idempotency-Key": `workspace-${globalThis.crypto.randomUUID()}` },
        body: JSON.stringify(input)
      });
      if (!isWorkspaceSummary(value)) throw new WorkspaceClientError(502);
      return value;
    }
  };
}

function isWorkspaceSummary(value: unknown): value is WorkspaceSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record["organizationId"] === "string" &&
    typeof record["organizationName"] === "string" &&
    typeof record["workspaceId"] === "string" &&
    typeof record["workspaceName"] === "string" &&
    typeof record["slug"] === "string" &&
    (record["role"] === "owner" ||
      record["role"] === "admin" ||
      record["role"] === "editor" ||
      record["role"] === "viewer") &&
    Array.isArray(record["capabilities"]) &&
    record["capabilities"].every((capability) => typeof capability === "string") &&
    typeof record["createdAt"] === "string"
  );
}
