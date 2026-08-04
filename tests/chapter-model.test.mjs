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
  assert.equal(chapter.buttons[1].url, null); // rejected javascript: URL
});
