/**
 * Guided & Free Exploration Modes for Sandbox Demos — TASK-149
 */

export type ExplorationMode = "guided" | "free_exploration" | "hybrid";

export interface ExplorationConfig {
  readonly mode: ExplorationMode;
  readonly allowedActions: readonly string[];
  readonly goalCompletedSelector: string;
}

export function createExplorationConfig(
  mode: ExplorationMode = "guided",
  allowedActions: readonly string[] = [],
  goalCompletedSelector = "#goal-complete"
): ExplorationConfig {
  return Object.freeze({
    mode,
    allowedActions: Object.freeze([...allowedActions]),
    goalCompletedSelector
  });
}

export function evaluateGoalCompletion(renderedHtml: string, goalSelector: string): boolean {
  const cleanSelector = goalSelector.replace(/^#/, "");
  return (
    renderedHtml.includes(`id="${cleanSelector}"`) || renderedHtml.includes(`id='${cleanSelector}'`)
  );
}
