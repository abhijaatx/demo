/**
 * Hotspot Domain Schema & Validation — TASK-061
 */

import { clampNormalizedCoordinate } from "./canvas-coordinates.js";
import type { DemoHotspot } from "./demo-document.js";

export type HotspotActionType = "next_step" | "prev_step" | "goto_step" | "open_url" | "none";

export interface HotspotActionConfig {
  readonly type: HotspotActionType;
  readonly targetStepId?: string | null;
  readonly url?: string | null;
  readonly openInNewTab?: boolean;
}

export function validateSafeUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("vbscript:")
  ) {
    return null;
  }
  try {
    const parsed = new URL(trimmed, "https://example.com");
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
    return null;
  } catch {
    return null;
  }
}

export function parseAndNormalizeHotspot(input: unknown): DemoHotspot {
  if (!input || typeof input !== "object") {
    throw new Error("Hotspot input must be an object.");
  }

  const raw = input as Record<string, unknown>;

  const id =
    typeof raw["id"] === "string" && raw["id"].trim() ? raw["id"].trim() : `hotspot-${Date.now()}`;
  const numX = Number(raw["x"]);
  const x = clampNormalizedCoordinate(Number.isNaN(numX) ? 10 : numX);
  const numY = Number(raw["y"]);
  const y = clampNormalizedCoordinate(Number.isNaN(numY) ? 10 : numY);
  const numW = Number(raw["width"]);
  const width = clampNormalizedCoordinate(Number.isNaN(numW) ? 15 : numW);
  const numH = Number(raw["height"]);
  const height = clampNormalizedCoordinate(Number.isNaN(numH) ? 10 : numH);

  const tooltipText = typeof raw["tooltipText"] === "string" ? raw["tooltipText"] : null;
  const targetStepId = typeof raw["targetStepId"] === "string" ? raw["targetStepId"] : null;
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

  const styleRaw = (raw["style"] ?? {}) as Record<string, unknown>;
  const pulse = Boolean(styleRaw["pulse"] ?? true);
  const color =
    typeof styleRaw["color"] === "string" && /^#[0-9a-fA-F]{3,8}$/u.test(styleRaw["color"])
      ? styleRaw["color"]
      : "#4f46e5";
  const opacity =
    typeof styleRaw["opacity"] === "number" ? Math.max(0, Math.min(1, styleRaw["opacity"])) : 0.8;

  return Object.freeze({
    id,
    x,
    y,
    width,
    height,
    targetStepId: actionType === "open_url" ? null : targetStepId,
    tooltipText,
    actionType,
    url: actionType === "open_url" ? safeUrl : null,
    style: Object.freeze({
      pulse,
      color,
      opacity
    })
  });
}
