/**
 * Annotation Primitives & HTML Sanitization — TASK-065
 */

import { clampNormalizedCoordinate } from "./canvas-coordinates.js";

export type AnnotationKind =
  | "text"
  | "callout"
  | "arrow"
  | "line"
  | "rectangle"
  | "ellipse"
  | "highlight"
  | "icon"
  | "image"
  | "badge"
  | "button";

export interface AnnotationStyle {
  readonly backgroundColor?: string;
  readonly textColor?: string;
  readonly borderColor?: string;
  readonly borderWidth?: number;
  readonly borderRadius?: number;
  readonly fontSize?: number;
}

export interface AnnotationPrimitive {
  readonly id: string;
  readonly kind: AnnotationKind;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly zIndex: number;
  readonly text: string | null;
  readonly style: AnnotationStyle;
}

export function sanitizeAnnotationText(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  // Strips script tags, inline event attributes (onerror=, onload=), and unsafe html
  return raw
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/giu, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/giu, "")
    .trim();
}

export function createDefaultAnnotation(kind: AnnotationKind, x = 20, y = 20): AnnotationPrimitive {
  const id = `anno-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const clampedX = clampNormalizedCoordinate(x);
  const clampedY = clampNormalizedCoordinate(y);

  return Object.freeze({
    id,
    kind,
    x: clampedX,
    y: clampedY,
    width: kind === "line" || kind === "arrow" ? 30 : 20,
    height: kind === "line" || kind === "arrow" ? 2 : 12,
    zIndex: 1,
    text: kind === "text" ? "Sample Text" : kind === "button" ? "Click Me" : null,
    style: Object.freeze({
      backgroundColor: kind === "highlight" ? "rgba(251, 191, 36, 0.4)" : "#1e293b",
      textColor: "#ffffff",
      borderColor: "#4f46e5",
      borderWidth: 1,
      borderRadius: 6,
      fontSize: 14
    })
  });
}
