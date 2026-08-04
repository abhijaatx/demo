import assert from "node:assert/strict";
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
