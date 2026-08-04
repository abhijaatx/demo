import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("MCP workbench exposes least-privilege provider setup and bounded tool planning", async () => {
  const [route, surface, editor] = await Promise.all([
    readWebFile("app/mcp-server/page.tsx"),
    readWebFile("components/mcp-workbench.tsx"),
    readWebFile("components/editor-shell.tsx")
  ]);

  assert.match(route, /McpWorkbench/u);
  assert.match(surface, /MAX_PROMPT_LENGTH = 600/u);
  assert.match(surface, /list_workspaces/u);
  assert.match(surface, /get_demo_analytics/u);
  assert.match(surface, /get_showcase_sessions/u);
  assert.match(surface, /Connect with OAuth/u);
  assert.match(surface, /Revoke connection/u);
  assert.match(surface, /approval step/u);
  assert.match(surface, /No provider token is stored/u);
  assert.doesNotMatch(
    surface,
    /fetch\(|sendBeacon|dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u
  );
  assert.match(editor, /href="\/mcp-server"/u);
});
