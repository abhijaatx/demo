import assert from "node:assert/strict";
import { test } from "node:test";
import { isUrlAllowedForCapture, shouldMaskElementHint } from "@supademo/domain";

test("isUrlAllowedForCapture enforces domain allow and deny lists", () => {
  const policy = {
    allowedDomains: ["app.example.com"],
    deniedDomains: ["internal.example.com"],
    excludedCssSelectors: [".sensitive-data"],
    maskInputFields: true
  };

  assert.equal(isUrlAllowedForCapture("https://app.example.com/dashboard", policy), true);
  assert.equal(isUrlAllowedForCapture("https://internal.example.com/admin", policy), false);
});

test("shouldMaskElementHint identifies sensitive input fields and excluded selectors", () => {
  const policy = {
    allowedDomains: [],
    deniedDomains: [],
    excludedCssSelectors: [".private-field"],
    maskInputFields: true
  };

  assert.equal(shouldMaskElementHint("input#password", policy), true);
  assert.equal(shouldMaskElementHint("div.private-field", policy), true);
  assert.equal(shouldMaskElementHint("button.submit", policy), false);
});
