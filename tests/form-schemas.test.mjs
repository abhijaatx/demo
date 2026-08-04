import assert from "node:assert/strict";
import { test } from "node:test";
import { createFormField, createDemoFormSchema } from "@supademo/domain";

test("createFormField & createDemoFormSchema create validated frozen form schemas", () => {
  const f1 = createFormField("email", "Work Email", "email", true);
  const f2 = createFormField("role", "Role", "select", false, ["Engineering", "Product"]);

  const schema = createDemoFormSchema("form-1", "Lead Capture", [f1, f2]);

  assert.equal(schema.formId, "form-1");
  assert.equal(schema.fields.length, 2);
  assert.equal(schema.fields[0].fieldType, "email");
  assert.equal(schema.fields[1].options.length, 2);
});
