import { apiBaseUrl } from "./api-client";
import { readCsrfToken } from "./csrf";

export type DemoType = "guided_html" | "screenshot" | "video" | "sandbox";
export type DemoStatus =
  "draft" | "processing" | "published" | "failed" | "needs_update" | "archived";

export type Demo = Readonly<{
  id: string;
  workspaceId: string;
  folderId: string | null;
  ownerUserId: string;
  title: string;
  description: string | null;
  type: DemoType;
  status: DemoStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}>;

export type TrashItem = Readonly<{
  demo: Demo;
  deletedAt: string;
  expiresAt: string;
  daysRemaining: number;
}>;

export type CreateDemoInput = Readonly<{
  title: string;
  description: string | null;
  type: DemoType;
}>;

export type DemoListFilters = Readonly<{
  query?: string;
  ownerUserId?: string;
  type?: DemoType;
  status?: DemoStatus;
  tagIds?: readonly string[];
  updatedAfter?: string;
  updatedBefore?: string;
}>;

export class DemoClientError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(
      status === 401
        ? "Sign in to view demos."
        : status === 403
          ? "You don’t have permission to view demos in this workspace."
          : "Demos could not be loaded. Try again."
    );
    this.name = "DemoClientError";
    this.status = status;
  }
}

export interface DemoClient {
  list(workspaceId: string, filters?: DemoListFilters): Promise<readonly Demo[]>;
  listTrash(workspaceId: string): Promise<readonly TrashItem[]>;
  create(workspaceId: string, input: CreateDemoInput): Promise<Demo>;
  archive(workspaceId: string, demoId: string): Promise<Demo>;
  unarchive(workspaceId: string, demoId: string): Promise<Demo>;
  softDelete(workspaceId: string, demoId: string): Promise<void>;
  restore(workspaceId: string, demoId: string): Promise<Demo>;
  permanentDelete(workspaceId: string, demoId: string): Promise<void>;
}

export function createDemoClient(fetcher: typeof fetch = fetch): DemoClient {
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
    if (!response.ok) throw new DemoClientError(response.status);
    return (await response.json()) as T;
  };

  return {
    async list(workspaceId, filters = {}) {
      const query = serializeDemoFilters(filters);
      const value: unknown = await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/demos${query ? `?${query}` : ""}`
      );
      if (!Array.isArray(value) || !value.every(isDemo)) throw new DemoClientError(502);
      return value;
    },
    async listTrash(workspaceId) {
      const value: unknown = await request(`/workspaces/${encodeURIComponent(workspaceId)}/trash`);
      if (!Array.isArray(value) || !value.every(isTrashItem)) throw new DemoClientError(502);
      return value;
    },
    async create(workspaceId, input) {
      const value: unknown = await request(`/workspaces/${encodeURIComponent(workspaceId)}/demos`, {
        method: "POST",
        headers: { "Idempotency-Key": `demo-${globalThis.crypto.randomUUID()}` },
        body: JSON.stringify(input)
      });
      if (!isDemo(value)) throw new DemoClientError(502);
      return value;
    },
    async archive(workspaceId, demoId) {
      const value: unknown = await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/demos/${encodeURIComponent(demoId)}/archive`,
        { method: "POST" }
      );
      if (!isDemo(value)) throw new DemoClientError(502);
      return value;
    },
    async unarchive(workspaceId, demoId) {
      const value: unknown = await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/demos/${encodeURIComponent(demoId)}/unarchive`,
        { method: "POST" }
      );
      if (!isDemo(value)) throw new DemoClientError(502);
      return value;
    },
    async softDelete(workspaceId, demoId) {
      await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/demos/${encodeURIComponent(demoId)}`,
        { method: "DELETE" }
      );
    },
    async restore(workspaceId, demoId) {
      const value: unknown = await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/demos/${encodeURIComponent(demoId)}/restore`,
        { method: "POST" }
      );
      if (!isDemo(value)) throw new DemoClientError(502);
      return value;
    },
    async permanentDelete(workspaceId, demoId) {
      await request(
        `/workspaces/${encodeURIComponent(workspaceId)}/demos/${encodeURIComponent(demoId)}/permanent`,
        { method: "DELETE" }
      );
    }
  };
}

function serializeDemoFilters(filters: DemoListFilters): string {
  const params = new URLSearchParams();
  if (filters.query?.trim()) params.set("q", filters.query.trim().slice(0, 200));
  if (filters.ownerUserId) params.set("owner", filters.ownerUserId);
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (filters.tagIds?.length) params.set("tag", filters.tagIds.slice(0, 10).join(","));
  if (filters.updatedAfter) params.set("updatedAfter", filters.updatedAfter);
  if (filters.updatedBefore) params.set("updatedBefore", filters.updatedBefore);
  return params.toString();
}

function isDemo(value: unknown): value is Demo {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const demo = value as Record<string, unknown>;
  return (
    typeof demo["id"] === "string" &&
    typeof demo["workspaceId"] === "string" &&
    (demo["folderId"] === null || typeof demo["folderId"] === "string") &&
    typeof demo["ownerUserId"] === "string" &&
    typeof demo["title"] === "string" &&
    (demo["description"] === null || typeof demo["description"] === "string") &&
    isDemoType(demo["type"]) &&
    isDemoStatus(demo["status"]) &&
    (demo["publishedAt"] === null || typeof demo["publishedAt"] === "string") &&
    typeof demo["createdAt"] === "string" &&
    typeof demo["updatedAt"] === "string" &&
    (demo["deletedAt"] === null || typeof demo["deletedAt"] === "string")
  );
}

function isTrashItem(value: unknown): value is TrashItem {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const item = value as Record<string, unknown>;
  return (
    isDemo(item["demo"]) &&
    typeof item["deletedAt"] === "string" &&
    typeof item["expiresAt"] === "string" &&
    typeof item["daysRemaining"] === "number"
  );
}

function isDemoType(value: unknown): value is DemoType {
  return (
    value === "guided_html" || value === "screenshot" || value === "video" || value === "sandbox"
  );
}

function isDemoStatus(value: unknown): value is DemoStatus {
  return (
    value === "draft" ||
    value === "processing" ||
    value === "published" ||
    value === "failed" ||
    value === "needs_update" ||
    value === "archived"
  );
}
