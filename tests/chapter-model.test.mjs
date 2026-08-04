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
