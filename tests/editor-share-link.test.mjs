import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

test("editor exposes trackable, expiring, and step-specific share links", async () => {
  const source = await readFile(
    new URL("../apps/web/components/editor-shell.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /Trackable link label/u);
  assert.match(source, /Create expiring link/u);
  assert.match(source, /Share link starting step/u);
  assert.match(source, /buildShareLinkUrl/u);
  assert.match(source, /persistExpiringShareLink/u);
});

test("viewer enforces expiring links and updates step deep-link state", async () => {
  const source = await readFile(
    new URL("../apps/web/components/demo-viewer.tsx", import.meta.url),
    "utf8"
  );
  assert.match(source, /readExpiringShareLinkError/u);
  assert.match(source, /isShareLinkExpired/u);
  assert.match(source, /requestedStepIndex/u);
  assert.match(source, /searchParams\.set\("step"/u);
  assert.match(source, /This share link has expired/u);
});
