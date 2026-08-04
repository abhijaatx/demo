import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createDefaultDemoDocument,
  parseDemoDocument,
  serializeDemoDocument,
  InvalidDemoDocumentError,
  DEMO_DOCUMENT_VERSION
} from "@supademo/domain";

test("createDefaultDemoDocument generates valid document structure", () => {
  const doc = createDefaultDemoDocument("demo-123");
  assert.equal(doc.version, DEMO_DOCUMENT_VERSION);
  assert.equal(doc.demoId, "demo-123");
  assert.equal(doc.steps.length, 0);
  assert.deepEqual(doc.chapters, []);
  assert.equal(doc.settings.autoPlay, false);
  assert.deepEqual(doc.settings.personalization.allowlist, ["name", "role", "company", "email"]);
  assert.equal(doc.layout.aspectRatio, "16:9");
});

test("parseDemoDocument parses and normalizes raw JSON input", () => {
  const raw = {
    version: "1.0.0",
    demoId: "demo-456",
    settings: {
      autoPlay: true,
      logoUrl: "http://example.com/logo.png",
      personalization: { allowlist: ["name"], fallbacks: { name: "friend" } }
    },
    layout: { deviceFrame: "macbook" },
    steps: [
      {
        id: "step-1",
        orderIndex: 0,
        title: "Welcome Step",
        hotspots: [
          {
            id: "hotspot-1",
            x: 50,
            y: 50,
            width: 15,
            height: 10,
            tooltipText: "Click here"
          }
        ]
      }
    ]
  };

  const parsed = parseDemoDocument(raw);
  assert.equal(parsed.demoId, "demo-456");
  assert.equal(parsed.settings.autoPlay, true);
  assert.equal(parsed.settings.logoUrl, "http://example.com/logo.png");
  assert.deepEqual(parsed.settings.personalization.fallbacks, { name: "friend" });
  assert.equal(parsed.layout.deviceFrame, "macbook");
  assert.equal(parsed.steps.length, 1);
  assert.equal(parsed.steps[0].id, "step-1");
  assert.equal(parsed.steps[0].hotspots[0].tooltipText, "Click here");
});

test("parseDemoAudioNarration keeps safe audio metadata and rejects unsafe URLs", async () => {
  const { parseDemoAudioNarration } = await import("@supademo/domain");
  const parsed = parseDemoAudioNarration({
    assetId: "voice-1",
    audioUrl: "javascript:alert(1)",
    transcriptText: "A bounded script",
    speed: 9,
    stability: -1,
    source: "ai"
  });

  assert.equal(parsed.audioUrl, null);
  assert.equal(parsed.speed, 2);
  assert.equal(parsed.stability, 0);
  assert.equal(parsed.source, "ai");
});

test("serializeDemoDocument and parseDemoDocument perform round-trip serialization", () => {
  const initial = createDefaultDemoDocument("demo-789");
  const jsonString = serializeDemoDocument(initial);
  const reconstructed = parseDemoDocument(JSON.parse(jsonString));

  assert.equal(reconstructed.demoId, initial.demoId);
  assert.equal(reconstructed.version, initial.version);
  assert.equal(reconstructed.settings.theme.primaryColor, initial.settings.theme.primaryColor);
});

test("parseDemoDocument preserves chapters at beginning, middle, and end", () => {
  const parsed = parseDemoDocument({
    version: "1.0.0",
    demoId: "demo-chapters",
    steps: [
      { id: "step-1", orderIndex: 0, title: "First" },
      { id: "step-2", orderIndex: 1, title: "Second" }
    ],
    chapters: [
      { id: "chapter-end", orderIndex: 2, title: "Finish", buttons: [] },
      { id: "chapter-start", orderIndex: 0, title: "Welcome", buttons: [] },
      { id: "chapter-middle", orderIndex: 1, title: "Context", buttons: [] }
    ]
  });

  assert.deepEqual(
    parsed.chapters.map((chapter) => [chapter.id, chapter.orderIndex]),
    [
      ["chapter-start", 0],
      ["chapter-middle", 1],
      ["chapter-end", 2]
    ]
  );
});

test("parseDemoDocument rejects malformed shapes with InvalidDemoDocumentError", () => {
  assert.throws(
    () => parseDemoDocument("not an object"),
    (err) => err instanceof InvalidDemoDocumentError && err.message.includes("must be an object")
  );

  assert.throws(
    () => parseDemoDocument({ version: "1.0.0" }),
    (err) => err instanceof InvalidDemoDocumentError && err.field === "demoId"
  );
});
