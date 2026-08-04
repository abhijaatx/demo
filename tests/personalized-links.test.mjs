import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractPersonalizedVariablesFromUrl,
  generatePersonalizedEmbedUrl
} from "@supademo/domain";

test("extractPersonalizedVariablesFromUrl extracts only allowlisted variables", () => {
  const query = "first_name=Alice&company=Acme&secret_key=hacked";
  const allowlist = ["first_name", "company"];

  const extracted = extractPersonalizedVariablesFromUrl(query, allowlist);

  assert.equal(extracted["first_name"], "Alice");
  assert.equal(extracted["company"], "Acme");
  assert.equal(extracted["secret_key"], undefined);
});

test("generatePersonalizedEmbedUrl appends allowed variables to target URL", () => {
  const url = generatePersonalizedEmbedUrl(
    "https://demo.supademo.com/embed/123",
    { first_name: "Bob", unallowed: "value" },
    ["first_name"]
  );

  assert.equal(url.includes("first_name=Bob"), true);
  assert.equal(url.includes("unallowed"), false);
});
