import assert from "node:assert/strict";
import { test } from "node:test";
import { createViewerSessionAttribution, classifyDeviceType } from "@supademo/domain";

test("createViewerSessionAttribution classifies devices and extracts campaign params", () => {
  const attr = createViewerSessionAttribution(
    "demo-112",
    "https://example.com/demo?utm_campaign=summer_launch",
    "https://google.com/search",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)"
  );

  assert.equal(attr.demoId, "demo-112");
  assert.equal(attr.deviceType, "mobile");
  assert.equal(attr.campaignName, "summer_launch");
  assert.ok(attr.sessionId.startsWith("vsess-"));

  assert.equal(classifyDeviceType("Mozilla/5.0 (Windows NT 10.0)"), "desktop");
});
