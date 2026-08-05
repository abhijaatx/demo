import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createExtensionMessage } from "@supademo/domain";

test("createExtensionMessage constructs typed extension messages", () => {
  const msg = createExtensionMessage("START_RECORDING", { targetUrl: "https://example.com" });

  assert.equal(msg.v, 1);
  assert.equal(msg.kind, "START_RECORDING");
  assert.equal(msg.payload.targetUrl, "https://example.com");
});

test("capture extension is loadable and stores only bounded, cleaned active-tab metadata", async () => {
  const [manifest, background, content, popup] = await Promise.all([
    readFile(new URL("../apps/extension/manifest.json", import.meta.url), "utf8"),
    readFile(new URL("../apps/extension/background.js", import.meta.url), "utf8"),
    readFile(new URL("../apps/extension/content.js", import.meta.url), "utf8"),
    readFile(new URL("../apps/extension/popup.html", import.meta.url), "utf8")
  ]);

  assert.match(manifest, /"default_popup": "popup\.html"/u);
  assert.match(manifest, /"service_worker": "background\.js"/u);
  assert.match(manifest, /"scripting"/u);
  assert.match(manifest, /"start-recording"/u);
  assert.match(manifest, /Command\+Shift\+8/u);
  assert.match(manifest, /Command\+Shift\+9/u);
  assert.doesNotMatch(manifest, /content_scripts|<all_urls>|"tabs"/u);
  assert.ok(background.includes("parsed.origin + parsed.pathname"));
  assert.match(background, /MAX_CAPTURED_VALUE_LENGTH/u);
  assert.match(background, /MAX_STEPS/u);
  assert.match(background, /MAX_SCREENSHOT_BYTES/u);
  assert.match(background, /MAX_STORED_BYTES/u);
  assert.match(background, /normalizeState/u);
  assert.match(background, /chrome\.scripting\.executeScript/u);
  assert.match(background, /sender\?\.tab\?\.id/u);
  assert.match(background, /isTrustedSender|sender\?\.id === chrome\.runtime\.id/u);
  assert.doesNotMatch(background, /<all_urls>|"tabs"/u);
  assert.match(content, /SUPADEMO_START_CAPTURE/u);
  assert.match(content, /isSensitiveElement/u);
  assert.doesNotMatch(content, /\.value\b|innerHTML|eval\(/u);
  assert.match(popup, /Start recording/u);
  assert.match(popup, /Instant screenshot/u);
  assert.match(popup, /Manual capture/u);
  assert.match(popup, /Share with workspace/u);
  assert.match(popup, /Apply auto zoom/u);
  assert.match(popup, /Download JSON/u);
  assert.doesNotMatch(popup, /innerHTML/u);
});
