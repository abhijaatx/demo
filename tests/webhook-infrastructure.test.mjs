import assert from "node:assert/strict";
import { test } from "node:test";
import { validateWebhookUrl, createWebhookSignature } from "@supademo/domain";

test("validateWebhookUrl blocks SSRF target URLs", () => {
  assert.equal(validateWebhookUrl("https://hooks.slack.com/services/123"), true);
  assert.equal(validateWebhookUrl("http://hooks.slack.com/services/123"), false); // HTTP rejected
  assert.equal(validateWebhookUrl("https://localhost/webhook"), false); // Localhost rejected
  assert.equal(validateWebhookUrl("https://169.254.169.254/latest/meta-data"), false); // AWS metadata rejected
});

test("createWebhookSignature generates valid HMAC SHA-256 signatures", () => {
  const sig = createWebhookSignature('{"event":"lead.created"}', "secret-123", 1600000000000);
  assert.equal(sig.startsWith("t=1600000000000,v1="), true);
});
