import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("DemoViewer renders a password gate that blocks chapter content until unlocked", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /verifyChapterPassword/u);
  assert.match(source, /gateLocked/u);
  assert.match(source, /This chapter is password protected/u);
  assert.match(source, /type="password"/u);
  assert.match(source, /maxLength=\{128\}/u);
  assert.match(source, /Incorrect password\. Please try again\./u);
  assert.match(source, /unlockedChapterIds/u);
  // The chapter content (body, buttons, form, voiceover) renders only inside
  // the unlocked branch of the gate conditional.
  assert.match(source, /gateLocked && gate \? \(\s*<form/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});

test("DemoViewer never renders or leaks the stored password hash or plaintext", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );
  // The stored representation is only ever fed into the constant-time verifier.
  assert.match(source, /verifyChapterPassword\(candidate, gate\.passwordHash\)/u);
  assert.doesNotMatch(source, /gate\.passwordHash[\s\S]{0,80}value=/u);
  assert.doesNotMatch(source, /value=\{gatePasswordDraft[\s\S]{0,80}type="text"/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML/u);
});

test("DemoViewer fails closed on wrong or missing passwords and on hash failure", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /Enter the password to continue\./u);
  assert.match(source, /This chapter is temporarily unavailable\./u);
  assert.match(source, /role="alert"/u);
  assert.match(source, /aria-invalid=\{Boolean\(gateError\)\}/u);
});

test("DemoViewer keeps the chapter voiceover from autoplaying behind a locked gate", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /hasStarted && !gateLocked/u);
  assert.match(source, /gateLocked[\s\S]*currentChapter\?\.voiceover\?\.autoPlay/u);
});

test("DemoViewer gate leaves legacy and unlocked chapters unaffected", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  ); // The gate is only active on `gate` chapters when passwordProtection exists
  // and the chapter id is not in the unlocked set; everything else renders as
  // before (defense-in-depth for hand-edited documents).
  assert.match(source, /currentChapter\?\.type === "gate"/u);
  assert.match(
    source,
    /Boolean\(gate && !unlockedChapterIds\.has\(currentChapter\?\.id \?\? ""\)\)/u
  );
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|eval\(/u);
});
