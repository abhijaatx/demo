import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeHtmlContent } from "@supademo/domain";

test("sanitizeHtmlContent strips scripts, inline event handlers, and javascript: links", () => {
  const inputHtml = `<div>
    <script>alert('xss')</script>
    <button onclick="doBad()">Click</button>
    <a href="javascript:alert(1)">Link</a>
  </div>`;

  const report = sanitizeHtmlContent(inputHtml);

  assert.equal(report.sanitizedHtml.includes("<script>"), false);
  assert.equal(report.sanitizedHtml.includes("onclick"), false);
  assert.equal(report.sanitizedHtml.includes("javascript:"), false);
  assert.equal(report.removedTagsCount > 0, true);
  assert.equal(report.removedAttrsCount > 0, true);
});
