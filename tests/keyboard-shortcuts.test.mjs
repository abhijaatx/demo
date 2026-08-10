import assert from "node:assert/strict";
import { test } from "node:test";
import { SHORTCUT_REGISTRY, matchShortcut, shouldIgnoreShortcut } from "@supademo/domain";

test("matchShortcut matches meta+s to save and meta+z to undo", () => {
  assert.equal(matchShortcut("s", { metaOrCtrl: true }), "save");
  assert.equal(matchShortcut("z", { metaOrCtrl: true }), "undo");
  assert.equal(matchShortcut("z", { metaOrCtrl: true, shift: true }), "redo");
  assert.equal(matchShortcut("k", { metaOrCtrl: true }), "openPalette");
});

test("shouldIgnoreShortcut excludes text inputs and textareas for single-key shortcuts", () => {
  const deleteShortcut = SHORTCUT_REGISTRY.find((s) => s.action === "delete");

  assert.equal(shouldIgnoreShortcut("INPUT", true, deleteShortcut), true);
  assert.equal(shouldIgnoreShortcut("TEXTAREA", true, deleteShortcut), true);
  assert.equal(shouldIgnoreShortcut("DIV", false, deleteShortcut), false);
});
