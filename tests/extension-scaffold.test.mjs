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
  const [manifest, background, popup] = await Promise.all([
    readFile(new URL("../apps/extension/manifest.json", import.meta.url), "utf8"),
    readFile(new URL("../apps/extension/background.js", import.meta.url), "utf8"),
    readFile(new URL("../apps/extension/popup.html", import.meta.url), "utf8")
  ]);

  assert.match(manifest, /"default_popup": "popup\.html"/u);
  assert.match(manifest, /"service_worker": "background\.js"/u);
  assert.doesNotMatch(manifest, /content_scripts|<all_urls>|"tabs"/u);
  assert.ok(background.includes("`${parsed.origin}${parsed.pathname}`"));
  assert.match(background, /MAX_CAPTURED_VALUE_LENGTH/u);
  assert.match(background, /sender\.id !== chrome\.runtime\.id/u);
  assert.match(popup, /Capture current tab/u);
});
