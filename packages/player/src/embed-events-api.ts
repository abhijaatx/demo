/**
 * Embed PostMessage Events API — TASK-086
 */

import type { PlayerEvent } from "./player-events.js";

export interface EmbedPostMessagePayload {
  readonly type: "supademo:event";
  readonly event: PlayerEvent;
}

export function emitEmbedEvent(
  targetWindow: { postMessage: (message: unknown, targetOrigin: string) => void } | null,
  targetOrigin: string,
  event: PlayerEvent
): void {
  if (!targetWindow || typeof targetWindow.postMessage !== "function") return;
  const message: EmbedPostMessagePayload = Object.freeze({
    type: "supademo:event",
    event
  });
  targetWindow.postMessage(message, targetOrigin || "*");
}

export function isSupaDemoEmbedEvent(data: unknown): data is EmbedPostMessagePayload {
  if (!data || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  if (obj["type"] !== "supademo:event") return false;

  const eventObj = obj["event"] as Record<string, unknown> | undefined;
  return Boolean(eventObj && eventObj["v"] === 1 && typeof eventObj["kind"] === "string");
}
