import assert from "node:assert/strict";
import { test } from "node:test";
import { parseDemoChapter } from "@supademo/domain";

test("parseDemoChapter normalizes chapter types and validates safe URLs", () => {
  const chapter = parseDemoChapter({
    type: "intro",
    title: "Welcome to Product Demo",
    bodyText: "Learn how to get started.",
    buttons: [
      { label: "Start Walkthrough", actionType: "next" },
      { label: "Malicious Link", actionType: "url", url: "javascript:alert(1)" }
    ]
  });

  assert.equal(chapter.type, "intro");
  assert.equal(chapter.title, "Welcome to Product Demo");
  assert.equal(chapter.buttons.length, 2);
  assert.equal(chapter.buttons[0].actionType, "next");
  assert.equal(chapter.buttons[1].actionType, "next");
  assert.equal(chapter.buttons[1].url, null); // rejected javascript: URL
  assert.equal(chapter.mediaUrl, null);
});

test("parseDemoChapter bounds untrusted content and accepts safe chapter media", () => {
  const chapter = parseDemoChapter({
    title: "x".repeat(500),
    bodyText: "y".repeat(10_000),
    mediaUrl: "https://cdn.example.com/chapter.png",
    buttons: Array.from({ length: 30 }, (_, index) => ({
      id: `button-${index}`,
      label: "z".repeat(300),
      actionType: "url",
      url: "https://example.com/next"
    }))
  });

  assert.equal(chapter.title.length, 160);
  assert.equal(chapter.bodyText.length, 4_000);
  assert.equal(chapter.mediaUrl, "https://cdn.example.com/chapter.png");
  assert.equal(chapter.buttons.length, 12);
  assert.equal(chapter.buttons[0].label.length, 96);
});

test("parseDemoChapter applies backwards-compatible visual defaults", () => {
  const chapter = parseDemoChapter({ type: "cta", title: "Visual defaults" });

  assert.equal(chapter.layout, "center");
  assert.equal(chapter.theme, "light");
  assert.equal(chapter.backgroundColor, null);
  assert.equal(chapter.opacity, 1);
  assert.equal(chapter.blurPx, 0);
});

test("parseDemoChapter accepts valid chapter visual fields", () => {
  const chapter = parseDemoChapter({
    type: "cta",
    title: "Visuals",
    layout: "right",
    theme: "custom",
    backgroundColor: "#123456",
    opacity: 0.5,
    blurPx: 8
  });

  assert.equal(chapter.layout, "right");
  assert.equal(chapter.theme, "custom");
  assert.equal(chapter.backgroundColor, "#123456");
  assert.equal(chapter.opacity, 0.5);
  assert.equal(chapter.blurPx, 8);
});

test("parseDemoChapter rejects malformed visual enums, unsafe colors, and clamps ranges", () => {
  const chapter = parseDemoChapter({
    type: "cta",
    title: "Malformed visuals",
    layout: "diagonal",
    theme: "neon",
    backgroundColor: "url(javascript:alert(1))",
    opacity: -5,
    blurPx: 500
  });

  assert.equal(chapter.layout, "center");
  assert.equal(chapter.theme, "light");
  assert.equal(chapter.backgroundColor, null);
  assert.equal(chapter.opacity, 0.2);
  assert.equal(chapter.blurPx, 24);

  const hugeOpacity = parseDemoChapter({
    type: "cta",
    title: "Clamped opacity",
    opacity: 9,
    blurPx: -40
  });
  assert.equal(hugeOpacity.opacity, 1);
  assert.equal(hugeOpacity.blurPx, 0);
});

test("parseDemoChapter rejects CSS-injection colors and non-string opacity values", () => {
  const chapter = parseDemoChapter({
    type: "cta",
    title: "Color injection",
    backgroundColor: "#ffffff;background-image:url(https://evil.example/x.png)",
    opacity: "0.5",
    blurPx: "8px"
  });

  assert.equal(chapter.backgroundColor, null);
  assert.equal(chapter.opacity, 1);
  assert.equal(chapter.blurPx, 0);
});

test("parseDemoChapter defaults chapter voiceover to null when absent", () => {
  const chapter = parseDemoChapter({ type: "intro", title: "No voiceover" });
  assert.equal(chapter.voiceover, null);
});

test("parseDemoChapter supports optional chapter voiceovers with bounded narration", () => {
  const chapter = parseDemoChapter({
    type: "cta",
    title: "Voiceover chapter",
    voiceover: {
      assetId: "chapter-voice",
      audioUrl: "https://cdn.supademo.com/audio/chapter.mp3",
      transcriptText: "x".repeat(5_000),
      source: "ai",
      speed: 9,
      stability: -1,
      durationSeconds: -5
    }
  });

  assert.ok(chapter.voiceover);
  assert.equal(chapter.voiceover?.audioUrl, "https://cdn.supademo.com/audio/chapter.mp3");
  assert.equal(chapter.voiceover?.transcriptText?.length, 4_000);
  assert.equal(chapter.voiceover?.source, "ai");
  assert.equal(chapter.voiceover?.speed, 2);
  assert.equal(chapter.voiceover?.stability, 0);
  assert.equal(chapter.voiceover?.durationSeconds, 0);
});

test("parseDemoChapter accepts blob chapter voiceover URLs and rejects unsafe ones", () => {
  const blobChapter = parseDemoChapter({
    type: "outro",
    title: "Blob voiceover",
    voiceover: { audioUrl: "blob:https://example.com/abc-123" }
  });
  assert.equal(blobChapter.voiceover?.audioUrl, "blob:https://example.com/abc-123");

  const unsafeChapter = parseDemoChapter({
    type: "intro",
    title: "Unsafe voiceover",
    voiceover: {
      audioUrl: "javascript:alert(1)",
      transcriptText: "hello",
      source: "unknown-source"
    }
  });
  assert.ok(unsafeChapter.voiceover);
  assert.equal(unsafeChapter.voiceover?.audioUrl, null);
  assert.equal(unsafeChapter.voiceover?.source, "manual");
});

test("parseDemoChapter supports bounded native Forms chapters", () => {
  const chapter = parseDemoChapter({
    id: "form-chapter",
    type: "form",
    title: "Tell us about your team",
    form: {
      formId: "lead-form",
      title: "Lead capture",
      fields: [
        { id: "email", label: "Work email", fieldType: "email", isRequired: true },
        { id: "role", label: "Role", fieldType: "select", options: ["Product", "Sales"] }
      ],
      allowSkip: false,
      allowNonBusinessEmails: false,
      backgroundImageUrl: "javascript:alert(1)"
    }
  });
  assert.equal(chapter.type, "form");
  assert.equal(chapter.form?.fields.length, 2);
  assert.equal(chapter.form?.backgroundImageUrl, null);
});
