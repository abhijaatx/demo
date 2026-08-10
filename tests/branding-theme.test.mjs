import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseAndSanitizeBrandingTheme,
  sanitizeHexColor,
  sanitizeFontFamily
} from "@supademo/domain";

test("sanitizeHexColor & sanitizeFontFamily block malformed or injection strings", () => {
  assert.equal(sanitizeHexColor("invalid-color", "#6366f1"), "#6366f1");
  assert.equal(sanitizeHexColor("#ff0000", "#6366f1"), "#ff0000");

  assert.equal(sanitizeFontFamily("sans-serif; body { display:none }", "Inter"), "Inter");
  assert.equal(sanitizeFontFamily("Roboto", "Inter"), "Roboto");
});

test("parseAndSanitizeBrandingTheme returns clean theme defaults", () => {
  const theme = parseAndSanitizeBrandingTheme({
    primaryColor: "not-a-color",
    borderRadiusPx: 100 // clamped
  });

  assert.equal(theme.primaryColor, "#6366f1");
  assert.equal(theme.borderRadiusPx, 24); // clamped max 24
});
