export type UserPreferences = Readonly<{
  theme: "system" | "light" | "dark";
  locale: string;
  reducedMotion: boolean;
  emailNotifications: boolean;
}>;

export const defaultUserPreferences: UserPreferences = Object.freeze({
  theme: "system",
  locale: "en-US",
  reducedMotion: false,
  emailNotifications: true
});

export type UserIdentityInput = Readonly<{
  subject: string;
  email: string;
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
  displayName?: string;
  avatarUrl?: string | null;
  timezone?: string;
  preferences?: UserPreferences;
}>;

export class UserProfileValidationError extends Error {
  readonly field: string | undefined;

  constructor(message: string, field?: string) {
    super(message);
    this.name = "UserProfileValidationError";
    this.field = field;
  }
}

export class UserProfileStoreError extends Error {
  constructor() {
    super("The user profile could not be loaded or saved.");
    this.name = "UserProfileStoreError";
  }
}

export interface UserProfileRepository {
  syncIdentity(input: UserIdentityInput): Promise<UserProfile>;
  updateProfile(subject: string, patch: UserProfilePatch): Promise<UserProfile | null>;
}

export function normalizeIdentitySubject(value: unknown): string {
  if (typeof value !== "string") {
    throw new UserProfileValidationError("The identity subject is invalid.", "subject");
  }
  const subject = value.trim();
  if (subject.length < 1 || subject.length > 255 || hasControlCharacters(subject)) {
    throw new UserProfileValidationError("The identity subject is invalid.", "subject");
  }
  return subject;
}

export function normalizeProfileEmail(value: unknown): string {
  if (typeof value !== "string") {
    throw new UserProfileValidationError("The email address is invalid.", "email");
  }
  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email)) {
    throw new UserProfileValidationError("The email address is invalid.", "email");
  }
  return email;
}

export function defaultDisplayName(email: string): string {
  const localPart = email.split("@", 1)[0] ?? "User";
  const displayName = localPart
    .replace(/[._+-]+/gu, " ")
    .trim()
    .replace(/\s+/gu, " ")
    .slice(0, 120);
  return displayName || "User";
}

export function normalizeDisplayName(value: unknown): string {
  if (typeof value !== "string") {
    throw new UserProfileValidationError("Enter a display name.", "displayName");
  }
  const displayName = value.trim();
  if (displayName.length < 1 || displayName.length > 120 || hasControlCharacters(displayName)) {
    throw new UserProfileValidationError(
      "Enter a display name from 1 to 120 characters.",
      "displayName"
    );
  }
  return displayName;
}

export function normalizeAvatarUrl(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string" || value.length > 2_048) {
    throw new UserProfileValidationError("The avatar URL is invalid.", "avatarUrl");
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new UserProfileValidationError("The avatar URL is invalid.", "avatarUrl");
  }
  if (url.protocol !== "https:" || hasControlCharacters(value)) {
    throw new UserProfileValidationError("The avatar URL must use HTTPS.", "avatarUrl");
  }
  return url.toString();
}

export function normalizeTimezone(value: unknown): string {
  if (typeof value !== "string") {
    throw new UserProfileValidationError("Choose a valid timezone.", "timezone");
  }
  const timezone = value.trim();
  if (timezone.length < 1 || timezone.length > 64 || hasControlCharacters(timezone)) {
    throw new UserProfileValidationError("Choose a valid timezone.", "timezone");
  }
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
  } catch {
    throw new UserProfileValidationError("Choose a valid timezone.", "timezone");
  }
  return timezone;
}

export function normalizeUserPreferences(value: unknown): UserPreferences {
  if (!isRecord(value)) {
    throw new UserProfileValidationError("The preferences are invalid.", "preferences");
  }
  const allowedKeys = new Set(["theme", "locale", "reducedMotion", "emailNotifications"]);
  if (Object.keys(value).some((key) => !allowedKeys.has(key))) {
    throw new UserProfileValidationError(
      "The preferences contain an unsupported setting.",
      "preferences"
    );
  }
  const theme = value["theme"] ?? defaultUserPreferences.theme;
  const locale = value["locale"] ?? defaultUserPreferences.locale;
  const reducedMotion = value["reducedMotion"] ?? defaultUserPreferences.reducedMotion;
  const emailNotifications =
    value["emailNotifications"] ?? defaultUserPreferences.emailNotifications;
  if (
    (theme !== "system" && theme !== "light" && theme !== "dark") ||
    typeof locale !== "string" ||
    !/^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-[A-Z]{2})?$/u.test(locale) ||
    locale.length > 20 ||
    typeof reducedMotion !== "boolean" ||
    typeof emailNotifications !== "boolean"
  ) {
    throw new UserProfileValidationError("The preferences are invalid.", "preferences");
  }
  return Object.freeze({
    theme,
    locale,
    reducedMotion,
    emailNotifications
  });
}

export function parseUserProfilePatch(value: unknown): UserProfilePatch {
  if (!isRecord(value)) {
    throw new UserProfileValidationError("The profile update is invalid.");
  }
  const allowedKeys = new Set(["displayName", "avatarUrl", "timezone", "preferences"]);
  const keys = Object.keys(value);
  if (keys.length === 0 || keys.some((key) => !allowedKeys.has(key))) {
    throw new UserProfileValidationError("The profile update is invalid.");
  }
  const patch: {
    displayName?: string;
    avatarUrl?: string | null;
    timezone?: string;
    preferences?: UserPreferences;
  } = {};
  if ("displayName" in value) patch.displayName = normalizeDisplayName(value["displayName"]);
  if ("avatarUrl" in value) patch.avatarUrl = normalizeAvatarUrl(value["avatarUrl"]);
  if ("timezone" in value) patch.timezone = normalizeTimezone(value["timezone"]);
  if ("preferences" in value) patch.preferences = normalizeUserPreferences(value["preferences"]);
  return Object.freeze(patch);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 31 || code === 127;
  });
}
