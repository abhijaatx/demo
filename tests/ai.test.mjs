import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("AI marketing page exposes the reference hero and bounded AI entry actions", async () => {
  const [route, surface, css] = await Promise.all([
    readWebFile("app/ai/page.tsx"),
    readWebFile("components/marketing-ai.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(route, /MarketingAiPage/u);
  assert.match(surface, /Build, qualify, and scale with AI demo agents/u);
  assert.match(surface, /Supademo AI brings together demo agents/u);
  assert.match(surface, /Learn more/u);
  assert.match(surface, /Schedule a demo/u);
  assert.match(surface, /href="\/ai\/demo-agents"/u);
  assert.match(surface, /href="\/product-demo"/u);
  assert.match(surface, /marketing-ai-proof/u);
  assert.match(surface, /marketing-ai-features/u);
  assert.match(surface, /marketing-ai-toolkit/u);
  assert.match(surface, /aria-haspopup="listbox"/u);
  assert.match(surface, /role="listbox"/u);
  assert.match(surface, /role="option"/u);
  assert.match(surface, /referrerPolicy="no-referrer"/u);
  assert.match(surface, /Run 24\/7 demo agents that qualify and guide buyers/u);
  assert.match(surface, /Qualify, educate, and convert with agents that never go offline/u);
  assert.match(surface, /MarketingFooter variant="showcase"/u);
  assert.match(css, /\.marketing-ai-hero/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
