import assert from "node:assert/strict";
import { test } from "node:test";
import { certifyAccessibilityAndCompatibility } from "@supademo/domain";

test("certifyAccessibilityAndCompatibility confirms WCAG 2.2 AA compliance and zero critical findings", () => {
  const cert = certifyAccessibilityAndCompatibility();

  assert.equal(cert.isPassed, true);
  assert.equal(cert.wcagLevel, "WCAG 2.2 AA");
  assert.equal(cert.criticalAccessibilityFindings, 0);
  assert.equal(cert.browserCompatibilityMatrixPassed, true);
});
