import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  Form,
  FormErrorSummary,
  normalizeServerErrors,
  useForm
} from "../packages/ui/dist/index.js";

const readForms = () => readFile(new URL("../packages/ui/src/forms.tsx", import.meta.url), "utf8");

test("server errors are bounded, normalized, and do not expose arbitrary payloads", () => {
  const result = normalizeServerErrors({
    fieldErrors: {
      email: ["Invalid email\n", "Second message", "Third message", "Ignored message"],
      secret: { detail: "ignored" },
      password: "Use a longer password"
    },
    formError: "Please review the form."
  });

  assert.deepEqual(result, {
    fieldErrors: {
      email: "Invalid email",
      password: "Use a longer password"
    },
    formError: "Please review the form."
  });
  assert.deepEqual(normalizeServerErrors(new Error("internal database detail")), {
    fieldErrors: {}
  });
});

test("form error summary renders accessible field links and form-level errors", () => {
  const markup = renderToStaticMarkup(
    h(FormErrorSummary, {
      fieldErrors: { email: "Enter a valid email" },
      formError: "We could not save your changes.",
      fieldLabels: { email: "Email" },
      getFieldId: (name) => `profile-${name}`
    })
  );

  assert.match(markup, /role="alert"/u);
  assert.match(markup, /We could not save your changes\./u);
  assert.match(markup, /href="#profile-email"/u);
  assert.match(markup, /Email: Enter a valid email/u);
});

function ExampleForm() {
  const form = useForm({
    initialValues: { email: "creator@example.com", subscribed: false },
    onSubmit: async () => undefined
  });
  return h(Form, {
    form,
    children: h("input", { ...form.getFieldProps("email") })
  });
}

test("form binding preserves initial values and exposes stable field ids", () => {
  const markup = renderToStaticMarkup(h(ExampleForm));
  assert.match(markup, /name="email"/u);
  assert.match(markup, /value="creator@example\.com"/u);
  assert.match(markup, /id="ui-form-[^"]+-email"/u);
  assert.match(markup, /noValidate=""/u);
});

test("form architecture includes validation focus, beforeunload protection, and no value logging", async () => {
  const source = await readForms();
  assert.match(source, /document\.getElementById\(getFieldId\(firstField\)\)\?\.focus\(\)/u);
  assert.match(source, /beforeunload/u);
  assert.match(source, /event\.preventDefault\(\)/u);
  assert.match(source, /setIsDirty\(false\)/u);
  assert.doesNotMatch(source, /console\.(log|error|warn)/u);
  assert.doesNotMatch(source, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
});
