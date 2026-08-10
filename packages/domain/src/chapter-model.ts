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

export type ChapterType =
  "intro" | "context" | "instruction" | "cta" | "gate" | "survey" | "quiz" | "form" | "outro";

export type ChapterLayout = "left" | "center" | "right";
export type ChapterTheme = "light" | "dark" | "custom";

export interface ChapterButton {
  readonly id: string;
  readonly label: string;
  readonly actionType: "next" | "url" | "step";
  readonly targetStepId?: string | null;
  readonly url?: string | null;
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
  readonly buttons: readonly ChapterButton[];
}

const MAX_CHAPTER_TITLE_LENGTH = 160;
const MAX_CHAPTER_BODY_LENGTH = 4_000;
const MAX_PRESENTER_NOTES_LENGTH = 4_000;
const MAX_CHAPTER_BUTTONS = 12;
const MAX_BUTTON_LABEL_LENGTH = 96;
const MAX_TARGET_ID_LENGTH = 128;
const MAX_MEDIA_URL_LENGTH = 2_048;

const MIN_CHAPTER_OPACITY = 0.2;
const MAX_CHAPTER_OPACITY = 1;
const MAX_CHAPTER_BLUR_PX = 24;

const VALID_CHAPTER_LAYOUTS: readonly ChapterLayout[] = ["left", "center", "right"];
const VALID_CHAPTER_THEMES: readonly ChapterTheme[] = ["light", "dark", "custom"];

function boundedString(value: unknown, maximum: number): string | null {
  return typeof value === "string" ? value.slice(0, maximum) : null;
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
    buttons: Object.freeze(buttons)
  });
}
