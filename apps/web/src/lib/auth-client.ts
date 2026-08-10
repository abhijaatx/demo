import { apiBaseUrl } from "./api-client";
import { readCsrfToken, saveCsrfToken } from "./csrf";

export type AuthClientResponse = Readonly<{
  message: string;
  verificationRequired?: boolean;
  csrfToken?: string;
}>;

export class AuthClientError extends Error {
  readonly status: number;
  readonly retryAfterSeconds: number | null;

  constructor(status: number, retryAfterSeconds: number | null = null, message?: string) {
    super(
      message && message.length > 0
        ? message
        : status === 429
          ? "Too many attempts. Try again later."
          : "Authentication could not be completed. Try again."
    );
    this.name = "AuthClientError";
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export interface AuthClient {
  signUp(email: string, password: string): Promise<AuthClientResponse>;
  confirmEmail(email: string, code: string): Promise<AuthClientResponse>;
  signIn(email: string, password: string): Promise<AuthClientResponse>;
  signOut(): Promise<AuthClientResponse>;
  requestPasswordReset(email: string): Promise<AuthClientResponse>;
  resetPassword(email: string, code: string, password: string): Promise<AuthClientResponse>;
  refreshSession(): Promise<AuthClientResponse>;
}

export function createAuthClient(fetcher: typeof fetch = fetch): AuthClient {
  const request = async (
    operation: string,
    body?: Record<string, string>
  ): Promise<AuthClientResponse> => {
    let response: Response;
    try {
      response = await fetcher(`${apiBaseUrl}/auth/${operation}`, {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          ...(readCsrfToken() ? { "X-CSRF-Token": readCsrfToken() } : {})
        },
        ...(body ? { body: JSON.stringify(body) } : {})
      });
    } catch {
      throw new AuthClientError(
        0,
        null,
        "Unable to reach the authentication service. Check your connection and try again."
      );
    }
    const rawBody = await response.text();
    let parsedBody: unknown;
    try {
      parsedBody = rawBody.length > 0 ? JSON.parse(rawBody) : undefined;
    } catch {
      parsedBody = undefined;
    }
    if (!response.ok) {
      const retryAfter = Number(response.headers.get("retry-after"));
      throw new AuthClientError(
        response.status,
        Number.isSafeInteger(retryAfter) && retryAfter > 0 ? retryAfter : null,
        publicAuthErrorMessage(parsedBody)
      );
    }
    const value: unknown = parsedBody;
    if (!isAuthClientResponse(value)) throw new AuthClientError(502);
    if (typeof value.csrfToken === "string") saveCsrfToken(value.csrfToken);
    if (operation === "sign-out") saveCsrfToken(undefined);
    return value;
  };

  return {
    signUp: (email, password) => request("sign-up", { email, password }),
    confirmEmail: (email, code) => request("verify-email", { email, code }),
    signIn: (email, password) => request("sign-in", { email, password }),
    signOut: () => request("sign-out"),
    requestPasswordReset: (email) => request("forgot-password", { email }),
    resetPassword: (email, code, password) => request("reset-password", { email, code, password }),
    refreshSession: () => request("refresh-session")
  };
}

function publicAuthErrorMessage(value: unknown): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const record = value as Record<string, unknown>;
  const error = record["error"];
  if (!error || typeof error !== "object") return undefined;
  const message = (error as Record<string, unknown>)["message"];
  return typeof message === "string" && message.length > 0 && message.length <= 240
    ? message
    : undefined;
}

function isAuthClientResponse(value: unknown): value is AuthClientResponse {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record["message"] === "string" &&
    record["message"].length > 0 &&
    record["message"].length <= 240 &&
    (record["csrfToken"] === undefined ||
      (typeof record["csrfToken"] === "string" && record["csrfToken"].length >= 16))
  );
}
