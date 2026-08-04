import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractPersonalizedVariablesFromUrl,
  extractTemplateVariableNames,
  parseDemoPersonalization,
  resolveTemplateTokens
} from "@supademo/domain";

test("personalization settings are bounded and default to the documented variables", () => {
  const settings = parseDemoPersonalization({
    allowlist: [" Name ", "company", "__proto__", "role", "name"],
    fallbacks: { name: "there", company: "Acme", ignored: "secret" }
  });

  assert.deepEqual(settings.allowlist, ["name", "company", "role"]);
  assert.equal(settings.fallbacks.name, "there");
  assert.equal(settings.fallbacks.ignored, undefined);
});

test("viewer variables accept v_ links and ignore non-allowlisted or oversized values", () => {
  const variables = extractPersonalizedVariablesFromUrl(
    `?v_name=Alice&v_company=Acme&secret=hidden&v_role=${"x".repeat(300)}`,
    ["name", "company"]
  );

  assert.deepEqual(variables, { name: "Alice", company: "Acme" });
});

test("token names and fallback syntax are resolved without an HTML sink", () => {
  assert.deepEqual(extractTemplateVariableNames(["Hi {{name}}", '{{company | "your team"}}']), [
    "name",
    "company"
  ]);
  assert.equal(
    resolveTemplateTokens("Hi {{name | there}} at {{company}}", { name: "<Alice>" }, {}),
    "Hi <Alice> at "
  );
});
