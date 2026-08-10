import assert from "node:assert/strict";
import { test } from "node:test";
import { createDefaultAnnotation, sanitizeAnnotationText } from "@supademo/domain";

test("createDefaultAnnotation creates valid annotation primitive for all kinds", () => {
  const textAnno = createDefaultAnnotation("text", 10, 15);
  assert.equal(textAnno.kind, "text");
  assert.equal(textAnno.x, 10);
  assert.equal(textAnno.y, 15);
  assert.equal(textAnno.text, "Sample Text");

  const buttonAnno = createDefaultAnnotation("button", 30, 40);
  assert.equal(buttonAnno.kind, "button");
  assert.equal(buttonAnno.text, "Click Me");
});

test("sanitizeAnnotationText strips script tags and inline event handlers", () => {
  const malicious = '<script>alert("XSS")</script><div onerror="doBad()">Hello</div>';
  const clean = sanitizeAnnotationText(malicious);
  assert.equal(clean.includes("<script>"), false);
  assert.equal(clean.includes("onerror="), false);
  assert.equal(clean.includes("Hello"), true);
});
