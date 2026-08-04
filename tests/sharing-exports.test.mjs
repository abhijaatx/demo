import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDefaultDemoDocument,
  generateSharingMetadata,
  generatePopupEmbedSnippet,
  generateSopHtmlExport,
  generateSopTextExport,
  generateSopMarkdownExport
} from "@supademo/domain";

test("generateSharingMetadata generates OpenGraph tags and robots policies", () => {
  const doc = createDefaultDemoDocument("demo-meta-1");
  const metaPublic = generateSharingMetadata(doc, null, true);
  assert.equal(metaPublic.robotsPolicy, "index, follow");

  const metaPrivate = generateSharingMetadata(doc, null, false);
  assert.equal(metaPrivate.robotsPolicy, "noindex, nofollow");
});

test("generateSopMarkdownExport formats step-by-step SOP markdown document", () => {
  const doc = createDefaultDemoDocument("demo-sop-1");
  const step1 = {
    id: "s1",
    orderIndex: 0,
    title: "Open Settings",
    media: { storagePath: "/media/s1.png" },
    hotspots: [{ x: 50, y: 50, tooltipText: "Click Gear Icon" }],
    callouts: [],
    audioNarration: null
  };
  const docWithSteps = { ...doc, steps: [step1] };

  const markdown = generateSopMarkdownExport(docWithSteps);
  assert.equal(markdown.includes("# Standard Operating Procedure: demo-sop-1"), true);
  assert.equal(markdown.includes("![Step 1 screenshot](/media/s1.png)"), true);
  assert.equal(markdown.includes("Click Gear Icon"), true);
});

test("generatePopupEmbedSnippet bounds the demo identifier and SDK origin", () => {
  const snippet = generatePopupEmbedSnippet({
    demoId: "sales/' onclick='alert(1)",
    sdkUrl: "https://evil.example/supademo.js"
  });
  assert.equal(snippet.includes("evil.example"), false);
  assert.equal(snippet.includes("https://script.supademo.com/supademo.js"), true);
  assert.equal(
    snippet.includes("Supademo.open(decodeURIComponent('sales%2F%27%20onclick%3D%27alert(1)'))"),
    true
  );
});

test("Copy Steps exports escape text, keep safe images, and omit unsafe media", () => {
  const document = createDefaultDemoDocument("demo-copy");
  const step = {
    id: "step-1",
    orderIndex: 0,
    title: "Step 1",
    description: null,
    media: null,
    hotspots: [],
    callouts: [],
    audioNarration: null
  };
  const sample = {
    ...document,
    steps: [
      {
        ...step,
        title: "<script>alert(1)</script>",
        description: "Description with <b>markup</b>",
        media: {
          ...(step.media ?? {
            assetId: "asset",
            assetType: "image",
            storagePath: "",
            width: null,
            height: null,
            durationSeconds: null,
            posterPath: null
          }),
          storagePath: "javascript:alert(1)"
        },
        hotspots: [
          {
            ...step.hotspots[0],
            tooltipText: "<img src=x onerror=alert(1)>"
          }
        ]
      }
    ]
  };
  const html = generateSopHtmlExport(sample);
  const text = generateSopTextExport(sample);
  assert.equal(html.includes("<script>"), false);
  assert.doesNotMatch(html, /<img[^>]*onerror=/u);
  assert.equal(html.includes("javascript:"), false);
  assert.equal(html.includes("&lt;script&gt;"), true);
  assert.equal(text.includes("<script>"), true);
  assert.equal(text.includes("[Step image]"), true);
});
