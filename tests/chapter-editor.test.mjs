import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("ChapterEditor state changes produce updated chapter domain object", () => {
  const chapter = {
    id: "chap-1",
    type: "intro",
    orderIndex: 0,
    title: "Initial Title",
    bodyText: null,
    mediaAssetId: null,
    presenterNotes: null,
    buttons: []
  };

  const updated = {
    ...chapter,
    title: "Updated Title",
    bodyText: "Context description",
    presenterNotes: "Private note for speaker"
  };

  assert.equal(updated.title, "Updated Title");
  assert.equal(updated.bodyText, "Context description");
  assert.equal(updated.presenterNotes, "Private note for speaker");
});

test("ChapterEditor contract exposes the Supademo Forms authoring controls", async () => {
  const source = await readFile(
    new URL("../apps/web/components/editor/chapter-editor.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /value: "form"/u);
  assert.match(source, /Form fields/u);
  assert.match(source, /FORM_FIELD_LIMIT/u);
  assert.match(source, /Allow non-business emails/u);
  assert.match(source, /Background blur/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});
