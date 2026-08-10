import assert from "node:assert/strict";
import { test } from "node:test";
import {
  parseAndNormalizeHotspot,
  validateSafeUrl,
  sanitizeAnnotationText,
  generateRedactionBurnInManifest
} from "@supademo/domain";

test("Malicious XSS payloads in tooltips and annotation text are sanitized cleanly", () => {
  const xssText = `<img src="x" onerror="alert('XSS')"><script>window.location='http://attacker.com'</script>`;
  const cleanAnno = sanitizeAnnotationText(xssText);

  assert.equal(cleanAnno.includes("<script>"), false);
  assert.equal(cleanAnno.includes("onerror="), false);

  const maliciousUrl = "javascript:alert(document.cookie)";
  assert.equal(validateSafeUrl(maliciousUrl), null);
});

test("Irreversible server-side redaction manifest isolates permanent redactions", () => {
  const redactions = [
    { id: "r1", x: 10, y: 10, width: 20, height: 20, isPermanent: true },
    { id: "r2", x: 50, y: 50, width: 10, height: 10, isPermanent: false }
  ];

  const manifest = generateRedactionBurnInManifest("asset-sec-1", 1000, 1000, null, redactions);
  assert.equal(manifest.redactionsPx.length, 1);
  assert.equal(manifest.redactionsPx[0].id, "r1");
});

test("Corrupted hotspot object recovers with valid defaults", () => {
  const corrupted = { x: "invalid", y: null, width: -100 };
  const recovered = parseAndNormalizeHotspot(corrupted);

  assert.equal(recovered.x, 10); // fallback default
  assert.equal(recovered.y, 0);
  assert.equal(recovered.width, 0); // clamped -100 -> 0
  assert.ok(recovered.id.startsWith("hotspot-"));
});
