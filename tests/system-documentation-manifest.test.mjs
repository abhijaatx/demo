import assert from "node:assert/strict";
import { test } from "node:test";
import { generateSystemDocumentationManifest } from "@supademo/domain";

test("generateSystemDocumentationManifest confirms developer docs and runbook publication", () => {
  const manifest = generateSystemDocumentationManifest();

  assert.equal(manifest.isPassed, true);
  assert.equal(manifest.developerApiDocsPublished, true);
  assert.equal(manifest.onCallRunbooksPublished, true);
  assert.equal(manifest.troubleshootingCatalogPublished, true);
});
