import assert from "node:assert/strict";
import { test } from "node:test";
import { createVoiceAgentConfig } from "@supademo/domain";

test("createVoiceAgentConfig sets up locale and voice parameters", () => {
  const cfg = createVoiceAgentConfig("ag-167", "fr-FR", "voice_fr_1");

  assert.equal(cfg.agentId, "ag-167");
  assert.equal(cfg.languageLocale, "fr-FR");
  assert.equal(cfg.voiceId, "voice_fr_1");
  assert.equal(cfg.isVoiceOutputEnabled, true);
});
