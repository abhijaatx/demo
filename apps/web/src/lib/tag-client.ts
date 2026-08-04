import { apiBaseUrl } from "./api-client";
import { readCsrfToken } from "./csrf";

export type Tag = Readonly<{
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}>;

export class TagClientError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(
      status === 401
        ? "Sign in to view tags."
        : status === 403
          ? "You don’t have permission to manage tags in this workspace."
          : "Tags could not be loaded. Try again."
    );
    this.name = "TagClientError";
    this.status = status;
  }
}

export interface TagClient {
  list(workspaceId: string): Promise<readonly Tag[]>;
  create(workspaceId: string, name: string): Promise<Tag>;
  assignToDemo(workspaceId: string, tagId: string, demoId: string): Promise<void>;
  removeFromDemo(workspaceId: string, tagId: string, demoId: string): Promise<void>;
}

export function createTagClient(fetcher: typeof fetch = fetch): TagClient {
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
      throw new TagClientError(0);
    }
    if (!response.ok) throw new TagClientError(response.status);
    try {
      return (await response.json()) as T;
    } catch {
      throw new TagClientError(502);
    }
  };

  const pathFor = (workspaceId: string) => `/workspaces/${encodeURIComponent(workspaceId)}/tags`;

  return {
    async list(workspaceId) {
      const value: unknown = await request(pathFor(workspaceId));
      if (!Array.isArray(value) || !value.every(isTag)) throw new TagClientError(502);
      return value;
    },
    async create(workspaceId, name) {
      const value: unknown = await request(pathFor(workspaceId), {
        method: "POST",
        headers: { "Idempotency-Key": `tag-${globalThis.crypto.randomUUID()}` },
        body: JSON.stringify({ name })
      });
      if (!isTag(value)) throw new TagClientError(502);
      return value;
    },
    async assignToDemo(workspaceId, tagId, demoId) {
      await request(
        `${pathFor(workspaceId)}/${encodeURIComponent(tagId)}/demos/${encodeURIComponent(demoId)}`,
        { method: "POST" }
      );
    },
    async removeFromDemo(workspaceId, tagId, demoId) {
      await request(
        `${pathFor(workspaceId)}/${encodeURIComponent(tagId)}/demos/${encodeURIComponent(demoId)}`,
        { method: "DELETE" }
      );
    }
  };
}

function isTag(value: unknown): value is Tag {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const tag = value as Record<string, unknown>;
  return (
    typeof tag["id"] === "string" &&
    typeof tag["workspaceId"] === "string" &&
    typeof tag["name"] === "string" &&
    typeof tag["createdAt"] === "string" &&
    typeof tag["updatedAt"] === "string"
  );
}
