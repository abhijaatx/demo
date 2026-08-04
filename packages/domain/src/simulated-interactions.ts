/**
 * Non-Turing-Complete Bounded Simulated Interaction Primitives — TASK-147
 */

export type SimulatedActionKind = "click" | "toggle_visibility" | "navigate" | "input_text";

export interface SimulatedInteractionAction {
  readonly actionId: string;
  readonly triggerSelector: string;
  readonly actionKind: SimulatedActionKind;
  readonly targetSelector: string;
  readonly value?: string | undefined;
}

export function createSimulatedInteractionAction(
  actionId: string,
  triggerSelector: string,
  actionKind: SimulatedActionKind,
  targetSelector: string,
  value?: string
): SimulatedInteractionAction {
  if (!actionId.trim() || !triggerSelector.trim() || !targetSelector.trim()) {
    throw new Error("Action ID, trigger selector, and target selector are required.");
  }

  return Object.freeze({
    actionId: actionId.trim(),
    triggerSelector: triggerSelector.trim(),
    actionKind,
    targetSelector: targetSelector.trim(),
    value
  });
}
