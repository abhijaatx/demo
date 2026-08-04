import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeOriginUrl, createCapturedClickContext } from "@supademo/domain";

test("sanitizeOriginUrl strips sensitive token/password query params", () => {
  const sensitive = "https://app.example.com/dashboard?tab=billing&token=secret123&password=pass";
  const clean = sanitizeOriginUrl(sensitive);

  assert.equal(clean.includes("token="), false);
  assert.equal(clean.includes("password="), false);
  assert.equal(clean.includes("tab=billing"), true);
});

test("createCapturedClickContext normalizes coordinates and sanitizes hints", () => {
  const context = createCapturedClickContext({
    xPercent: 45.2,
    yPercent: 88.9,
    pageTitle: "  Billing Settings  ",
    rawUrl: "https://example.com/checkout",
    elementHint: "button#submit-btn"
  });

  assert.equal(context.xPercent, 45.2);
  assert.equal(context.pageTitle, "Billing Settings");
  assert.equal(context.elementHint, "button#submit-btn");
});
