import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildShareLinkUrl,
  calculateShareLinkExpiry,
  isShareLinkExpired,
  parseShareLinkExpiry,
  sanitizeShareLabel
} from "../packages/domain/dist/index.js";

test("share link helpers bound tracking labels, steps, and expiring tokens", () => {
  const expiresAtMs = calculateShareLinkExpiry("24h", 1_700_000_000_000);
  assert.equal(expiresAtMs, 1_700_086_400_000);
  const url = buildShareLinkUrl("https://demo.example/view?foo=bar", {
    trackingLabel: "launch email/1",
    step: 4,
    token: "sl_1234567890abcdef",
    expiresAtMs
  });
  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get("foo"), "bar");
  assert.equal(parsed.searchParams.get("ref"), "launch-email-1");
  assert.equal(parsed.searchParams.get("step"), "4");
  assert.equal(parsed.searchParams.get("share"), "sl_1234567890abcdef");
  assert.equal(parsed.searchParams.get("expires"), "1700086400");
  assert.equal(parseShareLinkExpiry(parsed.searchParams.get("expires")), expiresAtMs);
  assert.equal(isShareLinkExpired(expiresAtMs, 1_700_000_000_001), false);
  assert.equal(isShareLinkExpired(expiresAtMs, expiresAtMs), true);
});

test("share link helpers reject invalid or unbounded values", () => {
  assert.equal(
    sanitizeShareLabel("  <script>launch / email  </script> "),
    "-script-launch---email----script-"
  );
  const url = buildShareLinkUrl("https://demo.example/view", {
    trackingLabel: "",
    step: 0,
    token: "not-a-token",
    expiresAtMs: 1_700_000_000_000
  });
  assert.equal(url, "https://demo.example/view");
  assert.equal(parseShareLinkExpiry("javascript:alert(1)"), null);
});

test("share link helpers preserve existing parameters when composing links", () => {
  const tracked = buildShareLinkUrl("https://demo.example/view", {
    trackingLabel: "launch-email"
  });
  const deepLink = buildShareLinkUrl(tracked, { step: 2 });
  const parsed = new URL(deepLink);
  assert.equal(parsed.searchParams.get("ref"), "launch-email");
  assert.equal(parsed.searchParams.get("step"), "2");
});
