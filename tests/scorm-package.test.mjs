import assert from "node:assert/strict";
import { test } from "node:test";
import { buildScormFiles, createStoredZip, normalizeScormSource } from "@supademo/domain";

test("normalizeScormSource extracts iframe URLs and normalizes Supademo demo links", () => {
  const result = normalizeScormSource(
    '<div><iframe src="https://app.supademo.com/demo/demo-123?utm_source=lms"></iframe></div>'
  );
  assert.equal(result.sourceKind, "iframe");
  assert.equal(result.sourceUrl, "https://app.supademo.com/embed/demo-123?utm_source=lms");
});

test("normalizeScormSource rejects unsafe or non-HTTPS destinations", () => {
  assert.throws(() => normalizeScormSource("javascript:alert(1)"), /HTTPS URL/u);
  assert.throws(() => normalizeScormSource("http://localhost:3000/demo"), /public HTTPS/u);
  assert.throws(() => normalizeScormSource("https://user:pass@example.com/demo"), /public HTTPS/u);
  assert.throws(() => normalizeScormSource("<div>no iframe</div>"), /HTTPS URL/u);
});

test("buildScormFiles creates a safe SCORM 1.2 wrapper with bounded settings", () => {
  const files = buildScormFiles({
    sourceUrl: "https://app.supademo.com/demo/demo-456",
    courseTitle: 'Sales <script>alert("x")</script>',
    courseIdentifier: "Sales course / 2026",
    aspectRatio: 3,
    minHeight: 4_000,
    completionRule: "active-time",
    activeViewingSeconds: 10,
    showManualFallback: true
  });

  assert.deepEqual(Object.keys(files).sort(), [
    "imsmanifest.xml",
    "index.html",
    "scorm-wrapper.js",
    "styles.css"
  ]);
  assert.match(files["imsmanifest.xml"], /scormtype="sco"/u);
  assert.match(files["index.html"], /https:\/\/app\.supademo\.com\/embed\/demo-456/u);
  assert.match(files["index.html"], /&lt;script&gt;/u);
  assert.match(files["index.html"], /id="mark-complete"/u);
  assert.match(files["styles.css"], /min-height:4000px/u);
  assert.match(files["scorm-wrapper.js"], /event\.source !== iframe\.contentWindow/u);
  assert.match(files["scorm-wrapper.js"], /event\.origin !== sourceOrigin/u);
  assert.match(files["scorm-wrapper.js"], /Supademo:completed/u);
});

test("createStoredZip emits a valid stored ZIP with all SCORM files", () => {
  const files = buildScormFiles({
    sourceUrl: "https://example.com/lesson",
    courseTitle: "Lesson",
    courseIdentifier: "lesson",
    aspectRatio: 1.76,
    minHeight: 480,
    completionRule: "launched",
    activeViewingSeconds: 30,
    showManualFallback: false
  });
  const zip = createStoredZip(files);
  assert.equal(zip[0], 0x50);
  assert.equal(zip[1], 0x4b);
  assert.equal(zip[2], 0x03);
  assert.equal(zip[3], 0x04);
  const contents = new TextDecoder().decode(zip);
  for (const filename of Object.keys(files)) assert.equal(contents.includes(filename), true);
  assert.equal(zip[zip.length - 22], 0x50);
  assert.equal(zip[zip.length - 21], 0x4b);
  assert.equal(zip[zip.length - 20], 0x05);
  assert.equal(zip[zip.length - 19], 0x06);
});

test("createStoredZip also accepts bounded offline text packages", () => {
  const zip = createStoredZip({
    "index.html": "<!doctype html><title>Offline</title>",
    "demo.json": '{"title":"Offline demo"}'
  });
  const contents = new TextDecoder().decode(zip);
  assert.match(contents, /index\.html/u);
  assert.match(contents, /demo\.json/u);
});

test("createStoredZip rejects traversal, duplicate, and oversized entries", () => {
  assert.throws(() => createStoredZip({ "../escape.txt": "nope" }), /relative and normalized/u);
  assert.throws(
    () => createStoredZip({ "nested\\escape.txt": "nope" }),
    /relative and normalized/u
  );
  assert.throws(() => createStoredZip({}), /file count/u);
  assert.throws(() => createStoredZip({ "a.txt": "x".repeat(10_000_001) }), /too large/u);
});
