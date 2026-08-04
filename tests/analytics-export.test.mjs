import assert from "node:assert/strict";
import { test } from "node:test";
import {
  sanitizeCsvCell,
  createAnalyticsEvent,
  generateAnalyticsCsvExport
} from "@supademo/domain";

test("sanitizeCsvCell escapes formula injection characters", () => {
  assert.equal(sanitizeCsvCell("=SUM(1+1)"), "'=SUM(1+1)");
  assert.equal(sanitizeCsvCell("+cmd|' /C calc'!A0"), "'+cmd|' /C calc'!A0");
  assert.equal(sanitizeCsvCell("Normal Text"), "Normal Text");
});

test("generateAnalyticsCsvExport builds safe CSV strings", () => {
  const evt = createAnalyticsEvent("demo-119", "demo.load", { referrer: "=http://bad.com" });
  const csv = generateAnalyticsCsvExport([evt]);

  assert.equal(csv.includes("Event ID,Demo ID,Event Kind,Timestamp ISO,Metadata"), true);
  assert.equal(csv.includes("demo-119"), true);
});
