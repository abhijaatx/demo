import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createFormField,
  createDemoFormSchema,
  parseDemoFormSchema,
  FORM_FIELD_LIMIT
} from "@supademo/domain";

test("createFormField & createDemoFormSchema create validated frozen form schemas", () => {
  const f1 = createFormField("email", "Work Email", "email", true);
  const f2 = createFormField("role", "Role", "select", false, ["Engineering", "Product"]);

  const schema = createDemoFormSchema("form-1", "Lead Capture", [f1, f2]);

  assert.equal(schema.formId, "form-1");
  assert.equal(schema.fields.length, 2);
  assert.equal(schema.fields[0].fieldType, "email");
  assert.equal(schema.fields[1].options.length, 2);
  assert.equal(schema.allowSkip, false);
  assert.equal(schema.layout, "center");
});

test("form schemas bound fields, options, appearance, and unsafe image URLs", () => {
  const fields = Array.from({ length: 12 }, (_, index) =>
    createFormField(`f-${index}`, `Field ${index}`, "select", false, ["A", "B"])
  );
  const schema = createDemoFormSchema("form-bounded", "Lead capture", fields, {
    allowSkip: true,
    allowNonBusinessEmails: true,
    layout: "right",
    theme: "custom",
    backgroundColor: "#112233",
    backgroundImageUrl: "javascript:alert(1)",
    opacity: 4,
    blurPx: 100
  });

  assert.equal(schema.fields.length, FORM_FIELD_LIMIT);
  assert.equal(schema.backgroundImageUrl, null);
  assert.equal(schema.opacity, 1);
  assert.equal(schema.blurPx, 24);
  assert.equal(schema.allowSkip, true);
  assert.equal(schema.allowNonBusinessEmails, true);
});

test("parseDemoFormSchema fails closed for malformed form IDs and sanitizes fields", () => {
  const parsed = parseDemoFormSchema({
    formId: "form-parse",
    title: "Captured form",
    fields: [
      { id: "email", label: "Email", fieldType: "email", isRequired: true },
      { id: "choice", label: "Choice", fieldType: "select", options: ["A", "B", "C"] }
    ],
    backgroundImageUrl: "data:text/html,<script>alert(1)</script>",
    layout: "left"
  });
  assert.equal(parsed?.fields.length, 2);
  assert.equal(parsed?.backgroundImageUrl, null);
  assert.equal(parsed?.layout, "left");
  assert.equal(parseDemoFormSchema({ formId: "", title: "Broken", fields: [] }), null);
});
