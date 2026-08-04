/**
 * Step Zoom, Pan & Motion Effects — TASK-067
 */

import { clampNormalizedCoordinate } from "./canvas-coordinates.js";

export type TransitionType = "none" | "fade" | "slide" | "zoom";

export interface StepMotionConfig {
  readonly focusX: number;
  readonly focusY: number;
  readonly zoomScale: number;
  readonly transitionType: TransitionType;
  readonly durationMs: number;
}

export interface TextAnimationConfig {
  readonly type: "none" | "typewriter" | "fade";
  readonly speedCps: number;
}

export function parseAndNormalizeMotionConfig(input: unknown): StepMotionConfig {
  if (!input || typeof input !== "object") {
    return Object.freeze({
      focusX: 50,
      focusY: 50,
      zoomScale: 1.0,
      transitionType: "none",
      durationMs: 300
    });
  }

  const raw = input as Record<string, unknown>;
  const focusX = clampNormalizedCoordinate(Number(raw["focusX"] ?? 50));
  const focusY = clampNormalizedCoordinate(Number(raw["focusY"] ?? 50));
  const zoomScale = Math.max(1.0, Math.min(3.0, Number(raw["zoomScale"] ?? 1.0)));
  const transitionType = ["none", "fade", "slide", "zoom"].includes(String(raw["transitionType"]))
    ? (String(raw["transitionType"]) as TransitionType)
    : "none";
  const durationMs = Math.max(0, Math.min(2000, Number(raw["durationMs"] ?? 300)));

  return Object.freeze({
    focusX,
    focusY,
    zoomScale,
    transitionType,
    durationMs
  });
}

export function resolveEffectiveMotionConfig(
  config: StepMotionConfig,
  prefersReducedMotion: boolean
): StepMotionConfig {
  if (prefersReducedMotion) {
    return Object.freeze({
      ...config,
      zoomScale: 1.0,
      transitionType: "none",
      durationMs: 0
    });
  }
  return config;
}
