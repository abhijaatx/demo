import assert from "node:assert/strict";
import { test } from "node:test";
import { createFormField, createDemoFormSchema, validateFormSubmission } from "@supademo/domain";

test("validateFormSubmission checks required fields and email formatting", () => {
  const f1 = createFormField("email", "Email", "email", true);
  const schema = createDemoFormSchema("form-sub-1", "Lead Form", [f1]);

  const invalidEmail = validateFormSubmission(schema, {
    formId: "form-sub-1",
    answers: { email: "not-an-email" }
  });
  assert.equal(invalidEmail.isValid, false);
  assert.equal(invalidEmail.errors.length, 1);

  const validEmail = validateFormSubmission(schema, {
    formId: "form-sub-1",
    answers: { email: "user@example.com" }
  });
  assert.equal(validEmail.isValid, true);
  assert.equal(validEmail.errors.length, 0);
});
