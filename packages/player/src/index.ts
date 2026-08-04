export {
  PlayerStateMachine,
  type PlayerMachineContext,
  type PlayerState
} from "./player-state-machine.js";

export { computePlayerStepRenderState, type PlayerStepRenderState } from "./player-view-model.js";

export {
  calculateNextAutoplayDelay,
  sanitizeAudienceOutputText,
  type PlaybackOptions
} from "./playback-controls.js";

export {
  clearViewerProgress,
  loadViewerProgress,
  saveViewerProgress,
  type ViewerSessionRecord
} from "./viewer-session.js";

export { SupaDemoSDK, supademoSDK, type PopupSDKOptions } from "./popup-sdk.js";

export {
  emitEmbedEvent,
  isSupaDemoEmbedEvent,
  type EmbedPostMessagePayload
} from "./embed-events-api.js";

export { createPlayerEvent, type PlayerEvent, type PlayerEventKind } from "./player-events.js";
export const packageName = "@supademo/player" as const;
