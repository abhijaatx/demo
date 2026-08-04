/**
 * Trackable, expiring, and deep-linked share URL primitives — TASK-238.
 *
 * The editor uses these helpers to build bounded links. The viewer still
 * performs its own access check before rendering an expiring local link.
 */

export type ShareLinkExpiryPreset = "none" | "1h" | "24h" | "7d" | "30d";

export const SHARE_LINK_EXPIRY_OPTIONS = Object.freeze([
  { value: "none", label: "No expiration", durationMs: null },
  { value: "1h", label: "1 hour", durationMs: 60 * 60 * 1_000 },
  { value: "24h", label: "24 hours", durationMs: 24 * 60 * 60 * 1_000 },
  { value: "7d", label: "7 days", durationMs: 7 * 24 * 60 * 60 * 1_000 },
  { value: "30d", label: "30 days", durationMs: 30 * 24 * 60 * 60 * 1_000 }
] as const);

const SHARE_LABEL_PATTERN = /^[a-zA-Z0-9._-]{1,64}$/u;
const SHARE_TOKEN_PATTERN = /^sl_[a-zA-Z0-9_-]{16,96}$/u;
const MAX_STEP_NUMBER = 10_000;

export function sanitizeShareLabel(value: unknown): string {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .slice(0, 64);
}

export function calculateShareLinkExpiry(
  preset: ShareLinkExpiryPreset,
  nowMs = Date.now()
): number | null {
  const option = SHARE_LINK_EXPIRY_OPTIONS.find((candidate) => candidate.value === preset);
  if (!option?.durationMs || !Number.isFinite(nowMs)) return null;
  return Math.floor(nowMs + option.durationMs);
}

export function parseShareLinkExpiry(value: string | null): number | null {
  if (!value || !/^\d{10,13}$/u.test(value)) return null;
  const raw = Number(value);
  if (!Number.isSafeInteger(raw)) return null;
  const milliseconds = value.length === 10 ? raw * 1_000 : raw;
  return milliseconds > 0 ? milliseconds : null;
}

export function isShareLinkExpired(expiresAtMs: number | null, nowMs = Date.now()): boolean {
  return expiresAtMs !== null && (!Number.isFinite(nowMs) || nowMs >= expiresAtMs);
}

export function buildShareLinkUrl(
  baseUrl: string,
  options: {
    readonly trackingLabel?: string;
    readonly step?: number | null;
    readonly token?: string | null;
    readonly expiresAtMs?: number | null;
  } = {}
): string {
  const url = new URL(baseUrl);
  if (Object.hasOwn(options, "trackingLabel")) {
    const trackingLabel = sanitizeShareLabel(options.trackingLabel);
    if (trackingLabel && SHARE_LABEL_PATTERN.test(trackingLabel)) {
      url.searchParams.set("ref", trackingLabel);
    } else {
      url.searchParams.delete("ref");
    }
  }

  if (Object.hasOwn(options, "step")) {
    const step = Number(options.step);
    if (Number.isSafeInteger(step) && step >= 1 && step <= MAX_STEP_NUMBER) {
      url.searchParams.set("step", String(step));
    } else {
      url.searchParams.delete("step");
    }
  }

  if (Object.hasOwn(options, "token") || Object.hasOwn(options, "expiresAtMs")) {
    const token = typeof options.token === "string" ? options.token : "";
    const expiresAtMs = options.expiresAtMs ?? null;
    if (SHARE_TOKEN_PATTERN.test(token) && expiresAtMs && Number.isSafeInteger(expiresAtMs)) {
      url.searchParams.set("share", token);
      url.searchParams.set("expires", String(Math.floor(expiresAtMs / 1_000)));
    } else {
      url.searchParams.delete("share");
      url.searchParams.delete("expires");
    }
  }

  return url.toString();
}

export function isValidShareToken(value: unknown): value is string {
  return typeof value === "string" && SHARE_TOKEN_PATTERN.test(value);
}
