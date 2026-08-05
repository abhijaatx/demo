import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("branding workbench covers workspace identity, watermark, and share CTA controls", async () => {
  const [component, route, theme] = await Promise.all([
    readWebFile("components/branding-workbench.tsx"),
    readWebFile("app/branding/page.tsx"),
    readFile(new URL("../packages/domain/src/branding-theme.ts", import.meta.url), "utf8")
  ]);

  assert.match(component, /Watermark/u);
  assert.match(component, /Logo & favicon/u);
  assert.match(component, /Share page button/u);
  assert.match(component, /maxLength=\{50\}/u);
  assert.match(component, /validateSafeUrl/u);
  assert.match(component, /safeExternalUrl/u);
  assert.match(component, /sanitizeHexColor/u);
  assert.match(component, /file\.size > 2_000_000/u);
  assert.match(component, /URL\.createObjectURL\(file\)/u);
  assert.match(component, /URL\.revokeObjectURL/u);
  assert.match(component, /production uploads require server-side/u);
  assert.doesNotMatch(component, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
  assert.match(theme, /SAFE_FONT_FAMILIES/u);
  assert.match(route, /BrandingWorkbench/u);
});
