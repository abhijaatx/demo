/**
 * Chapter Domain Model & Discriminated Types — TASK-071
 */ import { parseDemoAudioNarration, type DemoAudioNarration } from "./audio-narration.js";
import {
  boundedRange,
  parseDemoFormSchema,
  safeColor,
  type DemoFormSchema
} from "./form-schemas.js";
import { validateSafeUrl } from "./hotspot-schema.js";
import { sanitizePublicHttpsUrl } from "./public-url.js";

export type ChapterType =
  | "intro"
  | "context"
  | "instruction"
  | "cta"
  | "gate"
  | "survey"
  | "quiz"
  | "form"
  | "embed"
  | "outro";

export type ChapterLayout = "left" | "center" | "right";
export type ChapterTheme = "light" | "dark" | "custom";

export interface ChapterButton {
  readonly id: string;
  readonly label: string;
  readonly actionType: "next" | "url" | "step";
  readonly targetStepId?: string | null;
  readonly url?: string | null;
}

/**
 * Password protection for gate chapters. Only a self-describing one-way
 * PBKDF2-HMAC-SHA256 digest of the trimmed password is stored — the plaintext
 * password is never persisted, logged, rendered, or placed in a URL. A `null`
 * hash fails closed: the gate stays locked because no input can ever match.
 */
export interface ChapterPasswordProtection {
  readonly passwordHash: string | null;
  readonly buttonText: string;
  readonly backgroundColor: string | null;
  readonly textColor: string | null;
}

export interface DemoChapter {
  readonly id: string;
  readonly type: ChapterType;
  readonly orderIndex: number;
  readonly title: string;
  readonly bodyText: string | null;
  readonly mediaAssetId: string | null;
  readonly mediaUrl: string | null;
  readonly presenterNotes: string | null;
  /** Visual customization: content layout (left/center/right aligned). */
  readonly layout: ChapterLayout;
  /** Visual customization: background theme (light/dark/custom). */
  readonly theme: ChapterTheme;
  /** Allowlisted custom background color used with the custom theme. */
  readonly backgroundColor: string | null;
  /** Bounded background opacity in [0.2, 1]. */
  readonly opacity: number;
  /** Bounded background blur in pixels [0, 24]. */
  readonly blurPx: number;
  /** Optional chapter narration/voiceover using the shared safe narration model. */
  readonly voiceover: DemoAudioNarration | null;
  readonly form: DemoFormSchema | null;
  /** Password protection (gate chapters). Stored as a one-way hash only. */
  readonly passwordProtection: ChapterPasswordProtection | null;
  /**
   * Embedded forms, surveys, and calendars (embed chapters): a single
   * normalized public HTTPS URL. Only a validated URL is ever stored; unsafe
   * or malformed values are rejected at the parser.
   */
  readonly embedUrl: string | null;
  readonly buttons: readonly ChapterButton[];
}

const MAX_CHAPTER_TITLE_LENGTH = 160;
const MAX_CHAPTER_BODY_LENGTH = 4_000;
const MAX_PRESENTER_NOTES_LENGTH = 4_000;
const MAX_CHAPTER_BUTTONS = 12;
const MAX_BUTTON_LABEL_LENGTH = 96;
const MAX_TARGET_ID_LENGTH = 128;
const MAX_MEDIA_URL_LENGTH = 2_048;
const MAX_EMBED_URL_LENGTH = 2_048;
const MAX_PASSWORD_LENGTH = 128;
const MAX_GATE_BUTTON_LENGTH = 96;

/** PBKDF2-HMAC-SHA256 iterations used when creating new gate hashes. */
const PBKDF2_ITERATIONS = 100_000;
/** Lower bound so hand-crafted documents cannot publish trivially weak gates. */
const PBKDF2_MIN_ITERATIONS = 1_000;
/** Upper bound accepted from untrusted documents (CPU cost DoS guard). */
const PBKDF2_MAX_ITERATIONS = 600_000;
const PBKDF2_SALT_BYTES = 16;
/**
 * Self-describing stored hash: pbkdf2-sha256$<iterations>$<saltHex>$<keyHex>
 * (salt is 32 hex chars = 16 bytes, key is 64 hex chars = 32 bytes).
 */
const PBKDF2_FORMAT_REGEX = /^pbkdf2-sha256\$(\d+)\$([0-9a-f]{32})\$([0-9a-f]{64})$/u;

const MIN_CHAPTER_OPACITY = 0.2;
const MAX_CHAPTER_OPACITY = 1;
const MAX_CHAPTER_BLUR_PX = 24;

const VALID_CHAPTER_LAYOUTS: readonly ChapterLayout[] = ["left", "center", "right"];
const VALID_CHAPTER_THEMES: readonly ChapterTheme[] = ["light", "dark", "custom"];

function boundedString(value: unknown, maximum: number): string | null {
  return typeof value === "string" ? value.slice(0, maximum) : null;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function parsePbkdf2Hash(value: string): {
  readonly iterations: number;
  readonly saltHex: string;
  readonly keyHex: string;
} | null {
  const match = PBKDF2_FORMAT_REGEX.exec(value);
  if (!match) return null;
  const iterations = Number(match[1]);
  if (
    !Number.isSafeInteger(iterations) ||
    iterations < PBKDF2_MIN_ITERATIONS ||
    iterations > PBKDF2_MAX_ITERATIONS
  ) {
    return null;
  }
  return Object.freeze({
    iterations,
    saltHex: match[2] ?? "",
    keyHex: match[3] ?? ""
  });
}

async function derivePbkdf2Hex(
  password: string,
  saltHex: string,
  iterations: number
): Promise<string> {
  const keyMaterial = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  const saltBytes = new Uint8Array(
    saltHex.match(/.{2}/gu)?.map((pair) => Number.parseInt(pair, 16)) ?? []
  );
  const bits = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations },
    keyMaterial,
    256
  );
  return toHex(new Uint8Array(bits));
}

function constantTimeHexEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let diff = 0;
  for (let index = 0; index < left.length; index++) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

/**
 * One-way password digest for chapter password gates. Uses the platform Web
 * Crypto PBKDF2-HMAC-SHA256 primitive (salted, iterated) — standard, not
 * custom, cryptography — available in browsers and Node >= 20, so no
 * node:crypto import leaks into client bundles. The password is trimmed and
 * bounded before derivation; the result is a self-describing string.
 */
export async function hashChapterPassword(password: string): Promise<string> {
  const normalized = password.trim().slice(0, MAX_PASSWORD_LENGTH);
  const salt = new Uint8Array(PBKDF2_SALT_BYTES);
  globalThis.crypto.getRandomValues(salt);
  const saltHex = toHex(salt);
  const keyHex = await derivePbkdf2Hex(normalized, saltHex, PBKDF2_ITERATIONS);
  return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${saltHex}$${keyHex}`;
}

/**
 * Verify a submitted password against a stored PBKDF2 hash with a
 * constant-time comparison. A null, malformed, or over-iterated hash never
 * matches (fails closed).
 */
export async function verifyChapterPassword(
  password: string,
  storedHash: string | null
): Promise<boolean> {
  const parsed = storedHash ? parsePbkdf2Hash(storedHash) : null;
  if (!parsed) return false;
  const keyHex = await derivePbkdf2Hex(
    password.trim().slice(0, MAX_PASSWORD_LENGTH),
    parsed.saltHex,
    parsed.iterations
  );
  return constantTimeHexEqual(keyHex, parsed.keyHex);
}

/**
 * Normalize a chapter embed URL (forms, surveys, calendars). Only a bounded
 * public HTTPS URL without credentials, hashes, or private hosts is accepted;
 * anything else is rejected (null) and never persisted or rendered.
 */
export function sanitizeEmbedUrl(value: string | null | undefined): string | null {
  return sanitizePublicHttpsUrl(value, MAX_EMBED_URL_LENGTH);
}

/**
 * Parse untrusted serialized password protection. Malformed input fails
 * closed: a present gate with an invalid or over-iterated hash stays locked
 * (null hash).
 */
export function parseChapterPasswordProtection(input: unknown): ChapterPasswordProtection | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const rawHash = typeof raw["passwordHash"] === "string" ? raw["passwordHash"].trim() : "";
  const passwordHash = parsePbkdf2Hash(rawHash) ? rawHash : null;
  const rawButton = boundedString(raw["buttonText"], MAX_GATE_BUTTON_LENGTH);
  const buttonText = rawButton && rawButton.trim() ? rawButton.trim() : "Unlock";
  return Object.freeze({
    passwordHash,
    buttonText,
    backgroundColor: safeColor(raw["backgroundColor"]),
    textColor: safeColor(raw["textColor"])
  });
}

export function parseDemoChapter(input: unknown): DemoChapter {
  if (!input || typeof input !== "object") {
    throw new Error("Chapter input must be an object.");
  }

  const raw = input as Record<string, unknown>;

  const rawId = boundedString(raw["id"], MAX_TARGET_ID_LENGTH);
  const id = rawId && rawId.trim() ? rawId.trim() : `chap-${Date.now()}`;
  const validTypes: ChapterType[] = [
    "intro",
    "context",
    "instruction",
    "cta",
    "gate",
    "survey",
    "quiz",
    "form",
    "embed",
    "outro"
  ];
  const type: ChapterType = validTypes.includes(raw["type"] as ChapterType)
    ? (raw["type"] as ChapterType)
    : "intro";

  const orderIndex =
    typeof raw["orderIndex"] === "number" && Number.isFinite(raw["orderIndex"])
      ? Math.max(0, Math.floor(raw["orderIndex"]))
      : 0;
  const rawTitle = boundedString(raw["title"], MAX_CHAPTER_TITLE_LENGTH);
  const title = rawTitle && rawTitle.trim() ? rawTitle.trim() : "Untitled Chapter";
  const bodyText = boundedString(raw["bodyText"], MAX_CHAPTER_BODY_LENGTH);
  const mediaAssetId = boundedString(raw["mediaAssetId"], MAX_TARGET_ID_LENGTH);
  const rawMediaUrl = boundedString(raw["mediaUrl"], MAX_MEDIA_URL_LENGTH);
  const mediaUrl = rawMediaUrl?.startsWith("blob:") ? rawMediaUrl : validateSafeUrl(rawMediaUrl);
  const presenterNotes = boundedString(raw["presenterNotes"], MAX_PRESENTER_NOTES_LENGTH);
  // Backwards-compatible visual defaults: absent values render exactly like the
  // pre-visualization chapter (center-aligned, light theme, full-opacity).
  const layout: ChapterLayout = VALID_CHAPTER_LAYOUTS.includes(raw["layout"] as ChapterLayout)
    ? (raw["layout"] as ChapterLayout)
    : "center";
  const theme: ChapterTheme = VALID_CHAPTER_THEMES.includes(raw["theme"] as ChapterTheme)
    ? (raw["theme"] as ChapterTheme)
    : "light";
  const backgroundColor = safeColor(raw["backgroundColor"]);
  const opacity = boundedRange(raw["opacity"], MIN_CHAPTER_OPACITY, MAX_CHAPTER_OPACITY, 1);
  const blurPx = Math.round(boundedRange(raw["blurPx"], 0, MAX_CHAPTER_BLUR_PX, 0));
  const voiceover = raw["voiceover"] ? parseDemoAudioNarration(raw["voiceover"]) : null;
  const form = parseDemoFormSchema(raw["form"]);
  // Password protection only applies to gate chapters; a (possibly malformed)
  // passwordProtection on any other chapter type is ignored, never gating it.
  const passwordProtection =
    type === "gate" && raw["passwordProtection"]
      ? parseChapterPasswordProtection(raw["passwordProtection"])
      : null;
  // Embed URLs only apply to embed chapters; a serialized embedUrl on any
  // other chapter type is ignored so it can never change other behavior.
  const embedUrl =
    type === "embed" && typeof raw["embedUrl"] === "string"
      ? sanitizeEmbedUrl(raw["embedUrl"])
      : null;

  const rawButtons = Array.isArray(raw["buttons"])
    ? raw["buttons"].slice(0, MAX_CHAPTER_BUTTONS)
    : [];
  const buttons: ChapterButton[] = rawButtons.map((btnRaw, idx) => {
    const btnObj = (btnRaw ?? {}) as Record<string, unknown>;
    const rawButtonId = boundedString(btnObj["id"], MAX_TARGET_ID_LENGTH);
    const btnId = rawButtonId && rawButtonId.trim() ? rawButtonId.trim() : `btn-${idx}`;
    const rawLabel = boundedString(btnObj["label"], MAX_BUTTON_LABEL_LENGTH);
    const label = rawLabel && rawLabel.trim() ? rawLabel.trim() : "Continue";
    const requestedAction = String(btnObj["actionType"]);
    const parsedAction = ["next", "url", "step"].includes(requestedAction)
      ? (requestedAction as ChapterButton["actionType"])
      : "next";
    const rawTargetStepId = boundedString(btnObj["targetStepId"], MAX_TARGET_ID_LENGTH);
    const targetStepId = rawTargetStepId?.trim() || null;
    const rawUrl = boundedString(btnObj["url"], 2_048);
    const url = validateSafeUrl(rawUrl);
    const actionType = parsedAction === "url" && !url ? "next" : parsedAction;

    return Object.freeze({
      id: btnId,
      label,
      actionType,
      targetStepId: actionType === "url" ? null : targetStepId,
      url: actionType === "url" ? url : null
    });
  });

  return Object.freeze({
    id,
    type,
    orderIndex,
    title,
    bodyText,
    mediaAssetId,
    mediaUrl,
    presenterNotes,
    layout,
    theme,
    backgroundColor,
    opacity,
    blurPx,
    voiceover,
    form,
    passwordProtection,
    embedUrl,
    buttons: Object.freeze(buttons)
  });
}
