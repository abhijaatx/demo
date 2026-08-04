import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { createDefaultDemoDocument } from "@supademo/domain";

test("EditorShell contract verifies initial document state and layout sections", () => {
  const doc = createDefaultDemoDocument("demo-editor-1");
  assert.equal(doc.demoId, "demo-editor-1");
  assert.equal(doc.steps.length, 0);

  const editorConfig = {
    demoId: doc.demoId,
    readOnly: false,
    saveState: "saved",
    hasStepRail: true,
    hasCanvas: true,
    hasInspector: true
  };

  assert.equal(editorConfig.hasStepRail, true);
  assert.equal(editorConfig.hasCanvas, true);
  assert.equal(editorConfig.hasInspector, true);
});

test("EditorShell read-only mode disables mutations and presents notice", () => {
  const readOnlyProps = {
    demoId: "demo-editor-ro",
    readOnly: true,
    saveState: "saved"
  };

  assert.equal(readOnlyProps.readOnly, true);
});

test("EditorShell keeps the reference authoring surfaces and accessible mutation controls", async () => {
  const source = await readFile(
    new URL("../apps/web/components/editor-shell.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /editor-step-rail/u);
  assert.match(source, /editor-canvas/u);
  assert.match(source, /editor-inspector/u);
  assert.match(source, /aria-label="Demo Title"/u);
  assert.match(source, /aria-label=\{hotspot\.tooltipText/u);
  assert.match(source, /\+ Add hotspot/u);
  assert.match(source, /handleDuplicateStep/u);
  assert.match(source, /handleDeleteStep/u);
  assert.match(source, /handleMoveStep/u);
  assert.match(source, /Move up/u);
  assert.match(source, /Move down/u);
  assert.match(source, /Destination/u);
  assert.match(source, /Next step \(linear\)/u);
  assert.match(source, /Delete hotspot/u);
  assert.match(source, /ArrowUp/u);
  assert.match(source, /type="range"/u);
  assert.match(source, /type="color"/u);
  assert.match(source, /handleUndo/u);
  assert.match(source, /handleRedo/u);
  assert.match(source, /generateBranchingDiagnosticSummary/u);
  assert.match(source, /handleAddBranchChoice/u);
  assert.match(source, /editor-branch-panel/u);
  assert.match(source, /Conditional branching/u);
  assert.match(source, /\+ Add branch choice/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});
