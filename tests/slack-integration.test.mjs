import assert from "node:assert/strict";
import { test } from "node:test";
import { formatSlackLeadNotification } from "@supademo/domain";

test("formatSlackLeadNotification constructs valid Slack Block Kit messages", () => {
  const payload = formatSlackLeadNotification({
    channelId: "C123456",
    demoTitle: "Product Walkthrough",
    leadEmail: "john@example.com",
    intentScore: 90
  });

  assert.equal(payload.channel, "C123456");
  assert.equal(payload.text.includes("john@example.com"), true);
  assert.equal(payload.blocks.length, 1);
});
