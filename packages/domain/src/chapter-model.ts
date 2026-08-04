/**
 * Chapter Domain Model & Discriminated Types — TASK-071
 */

import { validateSafeUrl } from "./hotspot-schema.js";

export type ChapterType =
  "intro" | "context" | "instruction" | "cta" | "gate" | "survey" | "quiz" | "outro";

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
  readonly presenterNotes: string | null;
  readonly buttons: readonly ChapterButton[];
}

export function parseDemoChapter(input: unknown): DemoChapter {
  if (!input || typeof input !== "object") {
    throw new Error("Chapter input must be an object.");
  }

  const raw = input as Record<string, unknown>;

  const id =
    typeof raw["id"] === "string" && raw["id"].trim() ? raw["id"].trim() : `chap-${Date.now()}`;
  const validTypes: ChapterType[] = [
    "intro",
    "context",
    "instruction",
    "cta",
    "gate",
    "survey",
    "quiz",
    "outro"
  ];
  const type: ChapterType = validTypes.includes(raw["type"] as ChapterType)
    ? (raw["type"] as ChapterType)
    : "intro";

  const orderIndex = typeof raw["orderIndex"] === "number" ? Math.max(0, raw["orderIndex"]) : 0;
  const title =
    typeof raw["title"] === "string" && raw["title"].trim()
      ? raw["title"].trim()
      : "Untitled Chapter";
  const bodyText = typeof raw["bodyText"] === "string" ? raw["bodyText"] : null;
  const mediaAssetId = typeof raw["mediaAssetId"] === "string" ? raw["mediaAssetId"] : null;
  const presenterNotes = typeof raw["presenterNotes"] === "string" ? raw["presenterNotes"] : null;

  const rawButtons = Array.isArray(raw["buttons"]) ? raw["buttons"] : [];
  const buttons: ChapterButton[] = rawButtons.map((btnRaw, idx) => {
    const btnObj = (btnRaw ?? {}) as Record<string, unknown>;
    const btnId = typeof btnObj["id"] === "string" ? btnObj["id"] : `btn-${idx}`;
    const label = typeof btnObj["label"] === "string" ? btnObj["label"] : "Continue";
    const actionType = ["next", "url", "step"].includes(String(btnObj["actionType"]))
      ? (String(btnObj["actionType"]) as ChapterButton["actionType"])
      : "next";
    const targetStepId = typeof btnObj["targetStepId"] === "string" ? btnObj["targetStepId"] : null;
    const rawUrl = typeof btnObj["url"] === "string" ? btnObj["url"] : null;
    const url = validateSafeUrl(rawUrl);

    return Object.freeze({
      id: btnId,
      label,
      actionType,
      targetStepId,
      url
    });
  });

  return Object.freeze({
    id,
    type,
    orderIndex,
    title,
    bodyText,
    mediaAssetId,
    presenterNotes,
    buttons: Object.freeze(buttons)
  });
}
