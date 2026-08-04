import assert from "node:assert/strict";
import { test } from "node:test";
import { renderTemplateTokens } from "@supademo/domain";

test("renderTemplateTokens substitutes variables and escapes HTML to prevent XSS", () => {
  const template = "Hello {{ first_name }}, welcome to {{ company }}!";
  const vars = { first_name: "Jane", company: "<script>alert('xss')</script>" };

  const output = renderTemplateTokens(template, vars);

  assert.equal(
    output,
    "Hello Jane, welcome to &lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;!"
  );
});

test("renderTemplateTokens uses fallbacks for missing variables", () => {
  const template = "Welcome {{ role }}!";
  const fallbacks = { role: "Guest" };

  const output = renderTemplateTokens(template, {}, fallbacks);
  assert.equal(output, "Welcome Guest!");
});

test("renderTemplateTokens supports inline fallback syntax", () => {
  assert.equal(renderTemplateTokens('Hi {{name | "there"}}'), "Hi there");
  assert.equal(renderTemplateTokens("Hi {{name | there}}"), "Hi there");
});
