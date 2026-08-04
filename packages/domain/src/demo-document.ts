/**
 * Canonical Demo Document Model — TASK-051
 *
 * Defines typed schemas for demo settings, steps, media references,
 * layout, component IDs, ordering, and document versioning.
 *
 * Guarantees:
 * - Round-trip JSON serialization
 * - Predictable error handling for invalid/malformed shapes
 * - Stable element IDs across reordering and edits
 * - Backward compatibility with document versioning
 */

import { parseDemoChapter, type DemoChapter } from "./chapter-model.js";
import { validateSafeUrl } from "./hotspot-schema.js";

export const DEMO_DOCUMENT_VERSION = "1.0.0" as const;

export type AspectRatio = "16:9" | "4:3" | "9:16" | "fit";
export type DeviceFrame = "none" | "browser" | "macbook" | "iphone";
export type CalloutPosition = "top" | "bottom" | "left" | "right" | "center";

export type DemoTheme = Readonly<{
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadiusPx: number;
  fontFamily: string;
}>;

export type DemoSettings = Readonly<{
  autoPlay: boolean;
  loop: boolean;
  showControls: boolean;
  showStepList: boolean;
  allowFullscreen: boolean;
  theme: DemoTheme;
  logoUrl: string | null;
  customDomain: string | null;
}>;

export type DemoHotspotStyle = Readonly<{
  pulse: boolean;
  color: string;
  opacity: number;
}>;

export type DemoHotspot = Readonly<{
  id: string;
  x: number; // Normalized coordinate (0.0 to 100.0)
  y: number; // Normalized coordinate (0.0 to 100.0)
  width: number; // Normalized percentage width (0.0 to 100.0)
  height: number; // Normalized percentage height (0.0 to 100.0)
  targetStepId: string | null; // Next step ID or null for linear sequence
  tooltipText: string | null;
  /** Optional action metadata; omitted values retain the legacy linear behavior. */
  actionType?: "next_step" | "prev_step" | "goto_step" | "open_url" | "none";
  url?: string | null;
  style: DemoHotspotStyle;
}>;

export type DemoCallout = Readonly<{
  id: string;
  title: string;
  body: string;
  position: CalloutPosition;
  stepId: string;
}>;

export type DemoAudioNarration = Readonly<{
  assetId: string;
  durationSeconds: number;
  autoPlay: boolean;
}>;

export type DemoStepMedia = Readonly<{
  assetId: string;
  assetType: "image" | "video" | "audio" | "document" | "screenshot";
  storagePath: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  posterPath: string | null;
}>;

export type DemoStep = Readonly<{
  id: string;
  orderIndex: number;
  title: string;
  description: string | null;
  media: DemoStepMedia | null;
  hotspots: readonly DemoHotspot[];
  callouts: readonly DemoCallout[];
  audioNarration: DemoAudioNarration | null;
}>;

export type DemoLayout = Readonly<{
  aspectRatio: AspectRatio;
  deviceFrame: DeviceFrame;
  paddingPx: number;
}>;

export type DemoDocument = Readonly<{
  version: typeof DEMO_DOCUMENT_VERSION;
  demoId: string;
  settings: DemoSettings;
  layout: DemoLayout;
  steps: readonly DemoStep[];
  /** Contextual sections rendered before the matching step index. */
  chapters: readonly DemoChapter[];
  updatedAtIso: string;
}>;

// ── Default Document Factory ───────────────────────────────────────────────

export const DEFAULT_DEMO_THEME: DemoTheme = Object.freeze({
  primaryColor: "#4f46e5", // Indigo 600
  backgroundColor: "#0f172a", // Slate 900
  textColor: "#f8fafc", // Slate 50
  borderRadiusPx: 8,
  fontFamily: "Inter, sans-serif"
});

export const DEFAULT_DEMO_SETTINGS: DemoSettings = Object.freeze({
  autoPlay: false,
  loop: false,
  showControls: true,
  showStepList: true,
  allowFullscreen: true,
  theme: DEFAULT_DEMO_THEME,
  logoUrl: null,
  customDomain: null
});

export const DEFAULT_DEMO_LAYOUT: DemoLayout = Object.freeze({
  aspectRatio: "16:9",
  deviceFrame: "browser",
  paddingPx: 16
});

export function createDefaultDemoDocument(demoId: string): DemoDocument {
  return Object.freeze({
    version: DEMO_DOCUMENT_VERSION,
    demoId,
    settings: DEFAULT_DEMO_SETTINGS,
    layout: DEFAULT_DEMO_LAYOUT,
    steps: [],
    chapters: [],
    updatedAtIso: new Date().toISOString()
  });
}

// ── Validation & Serialization ─────────────────────────────────────────────

export class InvalidDemoDocumentError extends Error {
  constructor(
    message: string,
    readonly field?: string
  ) {
    super(message);
    this.name = "InvalidDemoDocumentError";
  }
}

export function parseDemoDocument(input: unknown): DemoDocument {
  if (typeof input !== "object" || input === null) {
    throw new InvalidDemoDocumentError("Demo document must be an object.");
  }
  const raw = input as Record<string, unknown>;

  if (typeof raw["version"] !== "string" || !raw["version"]) {
    throw new InvalidDemoDocumentError("Document version is required.", "version");
  }
  if (typeof raw["demoId"] !== "string" || !raw["demoId"]) {
    throw new InvalidDemoDocumentError("Document demoId is required.", "demoId");
  }

  const stepsRaw = Array.isArray(raw["steps"]) ? raw["steps"] : [];
  const steps: DemoStep[] = stepsRaw.map((stepRaw, index) => parseDemoStep(stepRaw, index));

  // Sort steps stably by orderIndex
  steps.sort((a, b) => a.orderIndex - b.orderIndex);

  const chaptersRaw = Array.isArray(raw["chapters"]) ? raw["chapters"] : [];
  const chapters: DemoChapter[] = chaptersRaw
    .map((chapterRaw) => parseDemoChapter(chapterRaw))
    .sort((a, b) => a.orderIndex - b.orderIndex);

  const settingsRaw =
    typeof raw["settings"] === "object" && raw["settings"] !== null
      ? (raw["settings"] as Record<string, unknown>)
      : {};
  const layoutRaw =
    typeof raw["layout"] === "object" && raw["layout"] !== null
      ? (raw["layout"] as Record<string, unknown>)
      : {};

  return Object.freeze({
    version: DEMO_DOCUMENT_VERSION,
    demoId: String(raw["demoId"]),
    settings: parseDemoSettings(settingsRaw),
    layout: parseDemoLayout(layoutRaw),
    steps: Object.freeze(steps),
    chapters: Object.freeze(chapters),
    updatedAtIso:
      typeof raw["updatedAtIso"] === "string" ? raw["updatedAtIso"] : new Date().toISOString()
  });
}

export function serializeDemoDocument(doc: DemoDocument): string {
  return JSON.stringify(doc);
}

// ── Private Parsers ────────────────────────────────────────────────────────

function parseDemoSettings(raw: Record<string, unknown>): DemoSettings {
  const themeRaw =
    typeof raw["theme"] === "object" && raw["theme"] !== null
      ? (raw["theme"] as Record<string, unknown>)
      : {};

  return Object.freeze({
    autoPlay: Boolean(raw["autoPlay"] ?? DEFAULT_DEMO_SETTINGS.autoPlay),
    loop: Boolean(raw["loop"] ?? DEFAULT_DEMO_SETTINGS.loop),
    showControls: Boolean(raw["showControls"] ?? DEFAULT_DEMO_SETTINGS.showControls),
    showStepList: Boolean(raw["showStepList"] ?? DEFAULT_DEMO_SETTINGS.showStepList),
    allowFullscreen: Boolean(raw["allowFullscreen"] ?? DEFAULT_DEMO_SETTINGS.allowFullscreen),
    theme: Object.freeze({
      primaryColor: String(themeRaw["primaryColor"] ?? DEFAULT_DEMO_THEME.primaryColor),
      backgroundColor: String(themeRaw["backgroundColor"] ?? DEFAULT_DEMO_THEME.backgroundColor),
      textColor: String(themeRaw["textColor"] ?? DEFAULT_DEMO_THEME.textColor),
      borderRadiusPx: Number(themeRaw["borderRadiusPx"] ?? DEFAULT_DEMO_THEME.borderRadiusPx),
      fontFamily: String(themeRaw["fontFamily"] ?? DEFAULT_DEMO_THEME.fontFamily)
    }),
    logoUrl: typeof raw["logoUrl"] === "string" ? raw["logoUrl"] : null,
    customDomain: typeof raw["customDomain"] === "string" ? raw["customDomain"] : null
  });
}

function parseDemoLayout(raw: Record<string, unknown>): DemoLayout {
  const validRatios: AspectRatio[] = ["16:9", "4:3", "9:16", "fit"];
  const validFrames: DeviceFrame[] = ["none", "browser", "macbook", "iphone"];

  const aspectRatio = validRatios.includes(raw["aspectRatio"] as AspectRatio)
    ? (raw["aspectRatio"] as AspectRatio)
    : DEFAULT_DEMO_LAYOUT.aspectRatio;

  const deviceFrame = validFrames.includes(raw["deviceFrame"] as DeviceFrame)
    ? (raw["deviceFrame"] as DeviceFrame)
    : DEFAULT_DEMO_LAYOUT.deviceFrame;

  return Object.freeze({
    aspectRatio,
    deviceFrame,
    paddingPx: Number.isInteger(raw["paddingPx"])
      ? Number(raw["paddingPx"])
      : DEFAULT_DEMO_LAYOUT.paddingPx
  });
}

function parseDemoStep(input: unknown, defaultIndex: number): DemoStep {
  if (typeof input !== "object" || input === null) {
    throw new InvalidDemoDocumentError(`Step at index ${defaultIndex} is not an object.`);
  }
  const raw = input as Record<string, unknown>;

  if (typeof raw["id"] !== "string" || !raw["id"]) {
    throw new InvalidDemoDocumentError(`Step at index ${defaultIndex} missing ID.`);
  }

  const hotspotsRaw = Array.isArray(raw["hotspots"]) ? raw["hotspots"] : [];
  const calloutsRaw = Array.isArray(raw["callouts"]) ? raw["callouts"] : [];

  return Object.freeze({
    id: String(raw["id"]),
    orderIndex: typeof raw["orderIndex"] === "number" ? raw["orderIndex"] : defaultIndex,
    title: String(raw["title"] ?? `Step ${defaultIndex + 1}`),
    description: typeof raw["description"] === "string" ? raw["description"] : null,
    media: raw["media"] ? parseDemoStepMedia(raw["media"]) : null,
    hotspots: Object.freeze(hotspotsRaw.map(parseDemoHotspot)),
    callouts: Object.freeze(calloutsRaw.map(parseDemoCallout)),
    audioNarration: raw["audioNarration"] ? parseDemoAudioNarration(raw["audioNarration"]) : null
  });
}

function parseDemoStepMedia(input: unknown): DemoStepMedia {
  const raw = input as Record<string, unknown>;
  return Object.freeze({
    assetId: String(raw["assetId"]),
    assetType: (["image", "video", "audio", "document", "screenshot"].includes(
      String(raw["assetType"])
    )
      ? String(raw["assetType"])
      : "image") as DemoStepMedia["assetType"],
    storagePath: String(raw["storagePath"]),
    width: typeof raw["width"] === "number" ? raw["width"] : null,
    height: typeof raw["height"] === "number" ? raw["height"] : null,
    durationSeconds: typeof raw["durationSeconds"] === "number" ? raw["durationSeconds"] : null,
    posterPath: typeof raw["posterPath"] === "string" ? raw["posterPath"] : null
  });
}

function parseDemoHotspot(input: unknown): DemoHotspot {
  const raw = input as Record<string, unknown>;
  const styleRaw =
    typeof raw["style"] === "object" && raw["style"] !== null
      ? (raw["style"] as Record<string, unknown>)
      : {};

  const requestedAction = String(raw["actionType"] ?? "next_step");
  const validActions = ["next_step", "prev_step", "goto_step", "open_url", "none"] as const;
  const parsedAction = validActions.includes(requestedAction as (typeof validActions)[number])
    ? (requestedAction as (typeof validActions)[number])
    : "next_step";
  const safeUrl = validateSafeUrl(typeof raw["url"] === "string" ? raw["url"] : null);
  const actionType =
    parsedAction === "open_url" && safeUrl
      ? parsedAction
      : parsedAction === "open_url"
        ? "next_step"
        : parsedAction;

  return Object.freeze({
    id: String(raw["id"]),
    x: Number(raw["x"] ?? 0),
    y: Number(raw["y"] ?? 0),
    width: Number(raw["width"] ?? 10),
    height: Number(raw["height"] ?? 10),
    targetStepId:
      actionType === "open_url"
        ? null
        : typeof raw["targetStepId"] === "string"
          ? raw["targetStepId"]
          : null,
    tooltipText: typeof raw["tooltipText"] === "string" ? raw["tooltipText"] : null,
    actionType,
    url: actionType === "open_url" ? safeUrl : null,
    style: Object.freeze({
      pulse: Boolean(styleRaw["pulse"] ?? true),
      color: String(styleRaw["color"] ?? "#4f46e5"),
      opacity: Number(styleRaw["opacity"] ?? 0.8)
    })
  });
}

function parseDemoCallout(input: unknown): DemoCallout {
  const raw = input as Record<string, unknown>;
  const validPositions: CalloutPosition[] = ["top", "bottom", "left", "right", "center"];
  const position = validPositions.includes(raw["position"] as CalloutPosition)
    ? (raw["position"] as CalloutPosition)
    : "bottom";

  return Object.freeze({
    id: String(raw["id"]),
    title: String(raw["title"] ?? ""),
    body: String(raw["body"] ?? ""),
    position,
    stepId: String(raw["stepId"] ?? "")
  });
}

function parseDemoAudioNarration(input: unknown): DemoAudioNarration {
  const raw = input as Record<string, unknown>;
  return Object.freeze({
    assetId: String(raw["assetId"]),
    durationSeconds: Number(raw["durationSeconds"] ?? 0),
    autoPlay: Boolean(raw["autoPlay"] ?? true)
  });
}
