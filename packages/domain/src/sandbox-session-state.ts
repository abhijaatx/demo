/**
 * Resettable Sandbox Viewer Session State — TASK-148
 */

export interface SandboxSessionState {
  readonly sessionId: string;
  readonly seedDatasetId: string;
  readonly mutatedValues: Readonly<Record<string, string>>;
  readonly createdAtMs: number;
}

export function createSandboxSessionState(
  sessionId: string,
  seedDatasetId = "default-seed"
): SandboxSessionState {
  return Object.freeze({
    sessionId,
    seedDatasetId,
    mutatedValues: Object.freeze({}),
    createdAtMs: Date.now()
  });
}

export function updateSandboxSessionValue(
  state: SandboxSessionState,
  key: string,
  value: string
): SandboxSessionState {
  return Object.freeze({
    ...state,
    mutatedValues: Object.freeze({
      ...state.mutatedValues,
      [key]: value
    })
  });
}

export function resetSandboxSessionState(state: SandboxSessionState): SandboxSessionState {
  return createSandboxSessionState(state.sessionId, state.seedDatasetId);
}
