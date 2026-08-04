/**
 * Desktop Recorder Shell Security & Configuration — TASK-106
 */

export type DesktopFramework = "tauri" | "electron";

export interface DesktopShellConfig {
  readonly framework: DesktopFramework;
  readonly enableContextIsolation: boolean;
  readonly enableNodeIntegration: boolean;
  readonly allowlistCommands: readonly string[];
}

export function createDesktopShellConfig(
  framework: DesktopFramework = "tauri"
): DesktopShellConfig {
  return Object.freeze({
    framework,
    enableContextIsolation: true,
    enableNodeIntegration: false,
    allowlistCommands: Object.freeze(["start_capture", "stop_capture", "get_sources"])
  });
}
