import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("legal aliases preserve Supademo's canonical route and metadata", async () => {
  const [terms, alias, privacy, ai, dpa, reference] = await Promise.all([
    readWebFile("app/terms/page.tsx"),
    readWebFile("app/terms-of-service/page.tsx"),
    readWebFile("app/privacy-policy/page.tsx"),
    readWebFile("app/privacy-policy/ai/page.tsx"),
    readWebFile("app/dpa/page.tsx"),
    readWebFile("components/marketing-reference-page.tsx")
  ]);

  assert.match(terms, /title: "Supademo \| Terms of Service"/u);
  assert.match(terms, /MarketingContentPage slug=\{\["terms-of-service"\]\}/u);
  assert.match(alias, /redirect\("\/terms"\)/u);
  assert.match(privacy, /title: "Privacy Policy and Data Security \| Supademo"/u);
  assert.match(privacy, /MarketingContentPage slug=\{\["privacy-policy"\]\}/u);
  assert.match(ai, /title: "AI Policy \| Supademo"/u);
  assert.match(ai, /MarketingContentPage slug=\{\["privacy-policy", "ai"\]\}/u);
  assert.match(dpa, /title: "Data Processing Agreement \| Supademo"/u);
  assert.match(dpa, /MarketingContentPage slug=\{\["dpa"\]\}/u);
  assert.match(reference, /Privacy Policy and Data Security \| Supademo/u);
  assert.match(reference, /AI Policy \| Supademo/u);
  assert.match(reference, /Data Processing Agreement \| Supademo/u);
  assert.doesNotMatch(alias, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});
