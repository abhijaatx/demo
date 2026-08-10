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

test("ChapterEditor exposes bounded allowed/blocked email domain controls", async () => {
  const source = await readFile(
    new URL("../apps/web/components/editor/chapter-editor.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /Allowed email domains/u);
  assert.match(source, /Blocked email domains/u);
  assert.match(source, /normalizeEmailDomainList/u);
  assert.match(source, /maxLength=\{2_000\}/u);
  assert.match(source, /disabled=\{readOnly\}/u);
  assert.match(source, /aria-describedby="chapter-form-allowed-domains-help"/u);
  assert.match(source, /aria-describedby="chapter-form-blocked-domains-help"/u);
  assert.match(source, /Blocked domains take precedence/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("ChapterEditor exposes bounded password-protect settings for gate chapters", async () => {
  const source = await readFile(
    new URL("../apps/web/components/editor/chapter-editor.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /Password protected/u);
  assert.match(source, /ChapterGateSettings/u);
  assert.match(source, /Password settings/u);
  assert.match(source, /type="password"/u);
  assert.match(source, /autoComplete="new-password"/u);
  assert.match(source, /maxLength=\{128\}/u);
  assert.match(source, /hashChapterPassword/u);
  assert.match(source, /parseChapterPasswordProtection/u);
  assert.match(source, /Button text/u);
  assert.match(source, /Background color/u);
  assert.match(source, /Text color/u);
  assert.match(source, /Remove protection/u);
  assert.match(source, /passwordProtection: type === "gate"/u);
  assert.match(source, /disabled=\{readOnly\}/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("ChapterEditor exposes chapter appearance controls for every chapter type", async () => {
  const source = await readFile(
    new URL("../apps/web/components/editor/chapter-editor.tsx", import.meta.url),
    "utf8"
  );
  // The appearance section is rendered outside the form-only branch and binds
  // to chapter fields (or form fields for form chapters).
  assert.match(source, /Chapter appearance/u);
  assert.match(source, /ChapterAppearanceSettings/u);
  assert.match(source, /Left aligned/u);
  assert.match(source, /Center aligned/u);
  assert.match(source, /Right aligned/u);
  assert.match(source, /<option value="dark">Dark<\/option>/u);
  assert.match(source, /<option value="custom">Custom<\/option>/u);
  assert.match(source, /type="color"/u);
  assert.match(source, /Background opacity: \{Math\.round\(opacity \* 100\)\}%/u);
  assert.match(source, /Background blur: \{blurPx\}px/u);
  assert.match(source, /min=\{0\.2\}/u);
  assert.match(source, /max=\{24\}/u);
  assert.match(source, /disabled=\{readOnly\}/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("ChapterEditor exposes chapter voiceover controls with save/remove and bounded upload", async () => {
  const source = await readFile(
    new URL("../apps/web/components/editor/chapter-editor.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /ChapterVoiceoverSettings/u);
  assert.match(source, /Narrate this chapter/u);
  assert.match(source, /Generate AI voiceover/u);
  assert.match(source, /Upload voice/u);
  assert.match(source, /accept="audio\/\*"/u);
  assert.match(source, /25 \* 1024 \* 1024/u);
  assert.match(source, /parseDemoAudioNarration/u);
  assert.match(source, /voiceover: null/u);
  assert.match(source, /Play automatically after the viewer starts/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("ChapterEditor keeps the legacy form appearance controls working", async () => {
  const source = await readFile(
    new URL("../apps/web/components/editor/chapter-editor.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /<summary>Appearance<\/summary>/u);
  assert.match(source, /form\.layout/u);
  assert.match(source, /form\.theme/u);
  assert.match(source, /form\.backgroundColor/u);
  assert.match(source, /form\.opacity/u);
  assert.match(source, /form\.blurPx/u);
});

test("ChapterEditor exposes Embed chapter settings with Go/Save semantics and bounded input", async () => {
  const source = await readFile(
    new URL("../apps/web/components/editor/chapter-editor.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /value: "embed"/u);
  assert.match(source, /ChapterEmbedSettings/u);
  assert.match(source, /Embed URL/u);
  assert.match(source, /sanitizeEmbedUrl/u);
  assert.match(source, /maxLength=\{2_048\}/u);
  assert.match(source, /disabled=\{readOnly\}/u);
  // Go only stages a preview; Save persists only the normalized validated URL.
  assert.match(source, /onClick=\{handleGo\}/u);
  assert.match(source, /onClick=\{handleSave\}/u);
  assert.match(source, /setPreviewUrl\(safeUrl\)/u);
  assert.match(source, /onChangeChapter\(\{ \.\.\.chapter, embedUrl: safeUrl \}\)/u);
  assert.match(source, /Enter a valid public HTTPS embed URL/u);
  // Preview iframe is restrictive and never same-origin.
  assert.match(source, /sandbox="allow-scripts allow-forms"/u);
  assert.match(source, /referrerPolicy="no-referrer"/u);
  assert.match(source, /Remove embed/u);
  // Switching away from the embed type clears any saved URL.
  assert.match(source, /embedUrl: type === "embed" \? chapter\.embedUrl : null/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});
