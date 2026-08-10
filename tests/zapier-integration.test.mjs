import assert from "node:assert/strict";
import { test } from "node:test";
import { createZapierSubscription, formatZapierLeadSampleData } from "@supademo/domain";

test("createZapierSubscription creates validated Zapier webhooks and rejects SSRF URLs", () => {
  const sub = createZapierSubscription("https://hooks.zapier.com/hooks/catch/123/abc/");
  assert.equal(sub.eventKind, "lead.created");

  assert.throws(
    () => createZapierSubscription("https://localhost/zap"),
    /Invalid or unsafe Zapier target URL/
  );
});

test("formatZapierLeadSampleData produces structured sample payloads for setup", () => {
  const sample = formatZapierLeadSampleData();
  assert.equal(sample["email"], "alex@example.com");
  assert.equal(sample["intentScore"], 85);
});
