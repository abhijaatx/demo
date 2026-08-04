/**
 * Preview & Device Mode Specifications — TASK-058
 */

import type { DeviceFrame, DemoDocument } from "./demo-document.js";

export type DevicePresetName = "desktop" | "macbook" | "tablet" | "mobile";

export type DevicePreset = Readonly<{
  name: DevicePresetName;
  label: string;
  frame: DeviceFrame;
  widthPx: number;
  heightPx: number;
  paddingPx: number;
}>;

export const DEVICE_PRESETS: Record<DevicePresetName, DevicePreset> = Object.freeze({
  desktop: Object.freeze({
    name: "desktop",
    label: "Desktop (16:9)",
    frame: "browser",
    widthPx: 1280,
    heightPx: 720,
    paddingPx: 16
  }),
  macbook: Object.freeze({
    name: "macbook",
    label: "MacBook Pro",
    frame: "macbook",
    widthPx: 1440,
    heightPx: 900,
    paddingPx: 20
  }),
  tablet: Object.freeze({
    name: "tablet",
    label: "Tablet (iPad)",
    frame: "browser",
    widthPx: 768,
    heightPx: 1024,
    paddingPx: 12
  }),
  mobile: Object.freeze({
    name: "mobile",
    label: "Mobile (iPhone)",
    frame: "iphone",
    widthPx: 375,
    heightPx: 812,
    paddingPx: 8
  })
});

export type ViewerPlaybackState = Readonly<{
  currentStepIndex: number;
  totalSteps: number;
  isPlaying: boolean;
  isCompleted: boolean;
  hotspotsClickable: boolean;
}>;

export function initializeViewerPlayback(document: DemoDocument): ViewerPlaybackState {
  return Object.freeze({
    currentStepIndex: 0,
    totalSteps: document.steps.length,
    isPlaying: document.settings.autoPlay,
    isCompleted: false,
    hotspotsClickable: true
  });
}

export function sanitizeViewerDocument(document: DemoDocument): DemoDocument {
  // Strips edit-only metadata from serialization for viewer playback
  return Object.freeze({
    ...document,
    steps: Object.freeze(
      document.steps.map((step) =>
        Object.freeze({
          ...step,
          hotspots: Object.freeze(
            step.hotspots.map((h) =>
              Object.freeze({
                ...h,
                // Ensure valid targets
                targetStepId: h.targetStepId ?? null
              })
            )
          )
        })
      )
    )
  });
}
