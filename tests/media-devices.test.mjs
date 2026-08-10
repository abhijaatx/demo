import assert from "node:assert/strict";
import { test } from "node:test";
import { createAudioVideoDeviceConfig, toggleMicrophoneMute } from "@supademo/domain";

test("createAudioVideoDeviceConfig & toggleMicrophoneMute control mic and webcam state", () => {
  const config = createAudioVideoDeviceConfig({
    micDeviceId: "mic-default",
    isMicMuted: false,
    webcamDeviceId: "cam-hd",
    isWebcamEnabled: true,
    webcamPosition: "bottom-left"
  });

  assert.equal(config.micDeviceId, "mic-default");
  assert.equal(config.webcamPosition, "bottom-left");
  assert.equal(config.isMicMuted, false);

  const muted = toggleMicrophoneMute(config);
  assert.equal(muted.isMicMuted, true);
});
