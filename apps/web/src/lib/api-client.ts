import type { paths } from "../generated/api";

export type ApiHealth =
  paths["/api/v1/health"]["get"]["responses"][200]["content"]["application/json"];

export type ApiClientState =
  | { readonly status: "checking" }
  | { readonly status: "online"; readonly service: string; readonly checkedAt: Date }
  | { readonly status: "offline" | "no-network"; readonly checkedAt: Date };

export class ApiClientError extends Error {
  readonly status: number;
  readonly requestId: string | null;

  constructor(status: number, requestId: string | null) {
    super("The API did not return a usable health response.");
    this.name = "ApiClientError";
    this.status = status;
    this.requestId = requestId;
  }
}

export const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/backend").replace(
  /\/$/u,
  ""
);

export async function fetchApiHealth(signal?: AbortSignal): Promise<ApiHealth> {
  const response = await fetch(`${apiBaseUrl}/health`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    signal
  });
  const body: unknown = await response.json();
  if (!response.ok || !isApiHealth(body)) {
    throw new ApiClientError(response.status, response.headers.get("x-request-id"));
  }
  return body;
}

function isApiHealth(value: unknown): value is ApiHealth {
  if (!value || typeof value !== "object") {
    return false;
  }
  const body = value as Record<string, unknown>;
  return body["status"] === "ok" && body["service"] === "api";
}
