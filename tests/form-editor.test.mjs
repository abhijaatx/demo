import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createFormField,
  createDemoFormSchema,
  addFormField,
  removeFormField,
  reorderFormFields
} from "@supademo/domain";

test("Form editor adds, removes, and reorders fields immutably", () => {
  const f1 = createFormField("f1", "First Name");
  const f2 = createFormField("f2", "Last Name");
  let schema = createDemoFormSchema("form-edit", "Contact", [f1]);

  schema = addFormField(schema, f2);
  assert.equal(schema.fields.length, 2);

  schema = reorderFormFields(schema, "f2", 0);
  assert.equal(schema.fields[0].id, "f2");

  schema = removeFormField(schema, "f1");
  assert.equal(schema.fields.length, 1);
  assert.equal(schema.fields[0].id, "f2");
});
