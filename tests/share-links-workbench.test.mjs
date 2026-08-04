import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("Share link workbench exposes gated, trackable, expiring, and deep-linked options", async () => {
  const [route, surface, editor] = await Promise.all([
    readWebFile("app/share-link/page.tsx"),
    readWebFile("components/share-links-workbench.tsx"),
    readWebFile("components/editor-shell.tsx")
  ]);

  assert.match(route, /ShareLinksWorkbench/u);
  assert.match(surface, /buildShareLinkUrl/u);
  assert.match(surface, /calculateShareLinkExpiry/u);
  assert.match(surface, /Public/u);
  assert.match(surface, /Password protected/u);
  assert.match(surface, /Email gated/u);
  assert.match(surface, /Unique tracking label/u);
  assert.match(surface, /Showcase demo/u);
  assert.match(surface, /MAX_PASSWORD_LENGTH = 120/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|outerHTML|eval\(|new Function\(/u
  );
  assert.match(editor, /href="\/share-link"/u);
});
