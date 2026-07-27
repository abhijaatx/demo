import { apiBaseUrl } from "./api-client";
import { readCsrfToken } from "./csrf";

export type UserPreferences = Readonly<{
  theme: "system" | "light" | "dark";
  locale: string;
  reducedMotion: boolean;
  emailNotifications: boolean;
}>;

export type UserProfile = Readonly<{
  userId: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  preferences: UserPreferences;
  createdAt: string;
  updatedAt: string;
}>;

export type UserProfilePatch = Readonly<{
  displayName: string;
  avatarUrl: string | null;
  timezone: string;
  preferences: UserPreferences;
}>;

export class ProfileClientError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(
      status === 401
        ? "Sign in to manage your profile."
        : "Your profile could not be loaded. Try again."
    );
    this.name = "ProfileClientError";
    this.status = status;
  }
}

export interface ProfileClient {
  getProfile(): Promise<UserProfile>;
  updateProfile(patch: UserProfilePatch): Promise<UserProfile>;
}

export function createProfileClient(fetcher: typeof fetch = fetch): ProfileClient {
  const request = async (
    method: "GET" | "PATCH",
    body?: UserProfilePatch
  ): Promise<UserProfile> => {
    const response = await fetcher(`${apiBaseUrl}/me/profile`, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(body && readCsrfToken() ? { "X-CSRF-Token": readCsrfToken() } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    if (!response.ok) throw new ProfileClientError(response.status);
    const value: unknown = await response.json();
    if (!isUserProfile(value)) throw new ProfileClientError(502);
    return value;
  };

  return {
    getProfile: () => request("GET"),
    updateProfile: (patch) => request("PATCH", patch)
  };
}

function isUserProfile(value: unknown): value is UserProfile {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const profile = value as Record<string, unknown>;
  const preferences = profile["preferences"];
  if (!preferences || typeof preferences !== "object" || Array.isArray(preferences)) return false;
  const normalizedPreferences = preferences as Record<string, unknown>;
  return (
    typeof profile["userId"] === "string" &&
    typeof profile["email"] === "string" &&
    typeof profile["displayName"] === "string" &&
    (profile["avatarUrl"] === null || typeof profile["avatarUrl"] === "string") &&
    typeof profile["timezone"] === "string" &&
    typeof profile["createdAt"] === "string" &&
    typeof profile["updatedAt"] === "string" &&
    (normalizedPreferences["theme"] === "system" ||
      normalizedPreferences["theme"] === "light" ||
      normalizedPreferences["theme"] === "dark") &&
    typeof normalizedPreferences["locale"] === "string" &&
    typeof normalizedPreferences["reducedMotion"] === "boolean" &&
    typeof normalizedPreferences["emailNotifications"] === "boolean"
  );
}
