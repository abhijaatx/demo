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
