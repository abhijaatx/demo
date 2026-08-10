import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import {
  addShowcaseItem,
  addShowcaseSection,
  createShowcaseDocument,
  parseShowcaseDocument,
  publishShowcase,
  sanitizeShowcaseUrl,
  updateShowcaseDocument
} from "@supademo/domain";

test("showcase authoring creates sections and mixed content items", () => {
  const initial = createShowcaseDocument("launch-2026", "Launch resources");
  const withSection = addShowcaseSection(initial, "Product tour");
  const sectionId = withSection.sections[1].id;
  const withItems = addShowcaseItem(withSection, sectionId, {
    title: "Interactive demo",
    type: "demo",
    description: "Walk through the new workflow.",
    url: "https://app.supademo.com/demo/demo-123#step-2"
  });
  assert.equal(withItems.sections[1].items[0].url, "https://app.supademo.com/demo/demo-123");
  assert.equal(withItems.sections[1].items[0].type, "demo");
});

test("showcase URLs reject private, credentialed, and non-HTTPS destinations", () => {
  assert.equal(sanitizeShowcaseUrl("http://example.com/demo"), null);
  assert.equal(sanitizeShowcaseUrl("https://user:pass@example.com/demo"), null);
  assert.equal(sanitizeShowcaseUrl("https://172.16.0.2/demo"), null);
  assert.equal(sanitizeShowcaseUrl("https://[fd00::1]/demo"), null);
  assert.equal(sanitizeShowcaseUrl("https://example.com/demo#secret"), "https://example.com/demo");
});

test("showcase parsing bounds untrusted content and publishing is explicit", () => {
  const parsed = parseShowcaseDocument({
    id: "<bad id>",
    title: "A".repeat(500),
    description: "D".repeat(2_000),
    layout: "unknown",
    sections: Array.from({ length: 60 }, (_, index) => ({
      id: `section-${index}`,
      title: `Section ${index}`,
      items: Array.from({ length: 120 }, (_, itemIndex) => ({
        id: `item-${itemIndex}`,
        title: "Item",
        type: "embed",
        url: "javascript:alert(1)",
        description: "Description"
      }))
    }))
  });
  assert.ok(parsed.id.length <= 96);
  assert.equal(parsed.title.length, 160);
  assert.equal(parsed.description.length, 600);
  assert.equal(parsed.layout, "section");
  assert.equal(parsed.sections.length, 50);
  assert.equal(parsed.sections[0].items.length, 100);
  assert.equal(parsed.sections[0].items[0].url, null);
  const updated = updateShowcaseDocument(parsed, { layout: "gallery", autoplayNext: true });
  assert.equal(updated.layout, "gallery");
  assert.equal(updated.autoplayNext, true);
  assert.equal(publishShowcase(updated).isPublished, true);
});

test("showcase editor captures DOM values before deferred state updates", async () => {
  const source = await readFile("apps/web/components/showcase-editor.tsx", "utf8");
  assert.doesNotMatch(source, /updateShowcaseDocument\([^)]*event\.currentTarget/u);
  assert.match(source, /const value = event\.currentTarget\.value/u);
  assert.match(source, /const checked = event\.currentTarget\.checked/u);
  assert.doesNotMatch(source, /function readDraft/u);
  assert.match(source, /createShowcaseDocument\(newShowcaseId\(\)\)/u);
});
