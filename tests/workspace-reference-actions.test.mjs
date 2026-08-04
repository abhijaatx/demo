import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("reference workspace creation actions use bounded destinations and accessible modal choices", async () => {
  const [surface, home, css] = await Promise.all([
    readWebFile("components/workspace-reference-surface.tsx"),
    readWebFile("components/home-workspace.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(surface, /CreateDemoDialog/u);
  assert.match(surface, /useSearchParams/u);
  assert.match(surface, /searchParams\.get\("new"\)/u);
  assert.match(surface, /role="listbox" aria-label="Demo format"/u);
  assert.match(surface, /role="option"/u);
  assert.match(surface, /Capture a workflow and add focused steps and hotspots\./u);
  assert.match(
    surface,
    /type CreateMode = "guided" \| "html" \| "sandbox" \| "screenshot" \| "video" \| "upload"/u
  );
  assert.match(surface, /draft-\$\{globalThis\.crypto\.randomUUID\(\)\}/u);
  assert.match(surface, /\/edit\?capture=\$\{encodeURIComponent\(selectedMode\)\}/u);
  assert.match(surface, /href=\{`\/demos\/\$\{item\.id\}\/edit\?sample=1`\}/u);
  assert.doesNotMatch(
    surface,
    /window\.location|dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u
  );

  assert.match(home, /href=\{`\/demos\/\$\{demo\.id\}\/edit\?sample=1`\}/u);
  assert.match(home, /href="\/ai\/demo-agents"/u);
  assert.match(home, /href=\{lesson\.href\}/u);
  assert.doesNotMatch(home, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);

  assert.match(css, /workspace-ref-create-dialog/u);
  assert.match(css, /workspace-ref-create-options/u);
  assert.match(css, /workspace-ref-create-in/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
});
