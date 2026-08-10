import assert from "node:assert/strict";
import { test } from "node:test";
import { generateIframeSnippet } from "@supademo/domain";

test("generateIframeSnippet constructs responsive wrapper with permissions and lazy loading", () => {
  const snippet = generateIframeSnippet({
    demoId: "demo-embed-1",
    aspectWidth: 16,
    aspectHeight: 9,
    allowFullscreen: true,
    lazyLoad: true
  });

  assert.equal(snippet.includes("padding-bottom: 56.25%"), true);
  assert.equal(snippet.includes('src="https://app.supademo.com/e/demo-embed-1"'), true);
  assert.equal(snippet.includes('allow="fullscreen; clipboard-write"'), true);
  assert.equal(snippet.includes('loading="lazy"'), true);
});
