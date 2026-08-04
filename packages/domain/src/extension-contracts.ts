/**
 * Extension Typed Message Contracts & Messaging Protocols — TASK-091
 */

export type ExtensionMessageKind =
  "START_RECORDING" | "STOP_RECORDING" | "PAUSE_RECORDING" | "RESUME_RECORDING" | "CAPTURE_STEP";

export interface ExtensionMessage<T = Record<string, unknown>> {
  readonly v: 1;
  readonly kind: ExtensionMessageKind;
  readonly payload: T;
}

export function createExtensionMessage<T extends Record<string, unknown>>(
  kind: ExtensionMessageKind,
  payload: T
): ExtensionMessage<T> {
  return Object.freeze({
    v: 1,
    kind,
    payload: Object.freeze({ ...payload })
  });
}
