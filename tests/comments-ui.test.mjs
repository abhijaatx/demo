import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("comment browser client builds typed, workspace-scoped REST API calls", async () => {
  const client = await readWebFile("src/lib/comment-client.ts");

  assert.match(client, /credentials: "include"/u);
  assert.match(client, /cache: "no-store"/u);
  assert.match(client, /Idempotency-Key/u);
  assert.match(client, /encodeURIComponent\(workspaceId\)/u);
  assert.match(client, /\/comments/u);
  assert.match(client, /\/resolve/u);
  assert.match(client, /\/reactions/u);
  assert.doesNotMatch(client, /eval\(|dangerouslySetInnerHTML/u);
});

test("comments panel component provides accessible landmarks, filters, and reaction controls", async () => {
  const panel = await readWebFile("components/comments-panel.tsx");

  assert.match(panel, /role="complementary"/u);
  assert.match(panel, /aria-label="Comments panel"/u);
  assert.match(panel, /aria-live="polite"/u);
  assert.match(panel, /filter === "unresolved"/u);
  assert.match(panel, /EMOJI_PICKER/u);
  assert.match(panel, /handleToggleResolve/u);
  assert.match(panel, /handleToggleReaction/u);
  assert.doesNotMatch(panel, /eval\(|dangerouslySetInnerHTML/u);
});
