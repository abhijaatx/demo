/**
 * Click Targets & Navigation Context Capture — TASK-094
 */

import { clampNormalizedCoordinate } from "./canvas-coordinates.js";

export interface CapturedClickContext {
  readonly xPercent: number;
  readonly yPercent: number;
  readonly pageTitle: string;
  readonly originUrl: string;
  readonly scrollX: number;
  readonly scrollY: number;
  readonly elementHint: string | null;
}

export function sanitizeOriginUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    // Strip sensitive query params
    const sensitiveKeys = ["token", "auth", "key", "password", "secret", "session", "access_token"];
    sensitiveKeys.forEach((key) => {
      parsed.searchParams.delete(key);
    });
    return parsed.toString();
  } catch {
    return "about:blank";
  }
}

export function createCapturedClickContext(input: {
  xPercent: number;
  yPercent: number;
  pageTitle?: string;
  rawUrl?: string;
  scrollX?: number;
  scrollY?: number;
  elementHint?: string;
}): CapturedClickContext {
  const xPercent = clampNormalizedCoordinate(input.xPercent);
  const yPercent = clampNormalizedCoordinate(input.yPercent);

  const pageTitle = typeof input.pageTitle === "string" ? input.pageTitle.trim() : "Captured Page";
  const originUrl = sanitizeOriginUrl(input.rawUrl ?? "");
  const scrollX = Math.max(0, input.scrollX ?? 0);
  const scrollY = Math.max(0, input.scrollY ?? 0);
  const elementHint =
    typeof input.elementHint === "string" ? input.elementHint.trim().slice(0, 100) : null;

  return Object.freeze({
    xPercent,
    yPercent,
    pageTitle,
    originUrl,
    scrollX,
    scrollY,
    elementHint
  });
}
