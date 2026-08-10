/**
 * Player Events & Extension Points — TASK-079
 */

export type PlayerEventKind =
  "LOAD" | "START" | "NODE_CHANGE" | "PROGRESS" | "ACTION" | "CTA_CLICK" | "COMPLETION" | "ERROR";

export interface PlayerEvent<T = Record<string, unknown>> {
  readonly v: 1;
  readonly kind: PlayerEventKind;
  readonly demoId: string;
  readonly timestampIso: string;
  readonly payload: T;
}

export function createPlayerEvent<T extends Record<string, unknown>>(
  kind: PlayerEventKind,
  demoId: string,
  payload: T
): PlayerEvent<T> {
  return Object.freeze({
    v: 1,
    kind,
    demoId,
    timestampIso: new Date().toISOString(),
    payload: Object.freeze({ ...payload })
  });
}
