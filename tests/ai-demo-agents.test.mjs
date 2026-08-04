import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("AI demo-agent page exposes the reference hero, preview asset, and instant-demo dialog", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/ai/demo-agents/page.tsx"),
    readWebFile("components/marketing-ai-agents.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingAiAgentsPage/u);
  assert.match(surface, /Run demos on autopilot/u);
  assert.match(surface, /AI Demo Agents/u);
  assert.match(surface, /hero-ai-demo-agent\.avif/u);
  assert.match(surface, /Try instant AI demo/u);
  assert.match(surface, /aria-modal="true"/u);
  assert.match(surface, /Escape/u);
  assert.match(surface, /Previous card/u);
  assert.match(surface, /Go to card \$\{index \+ 1\}/u);
  assert.match(surface, /referrerPolicy="no-referrer"/u);
  assert.match(surface, /href="\/product-demo"/u);
  assert.match(css, /\.marketing-ai-agents-hero/u);
  assert.match(css, /\.marketing-ai-agents-dialog/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
