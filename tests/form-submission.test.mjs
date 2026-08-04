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

test("validateFormSubmission enforces form identity, choices, business email policy, and unknown-field rejection", () => {
  const schema = createDemoFormSchema("form-policy", "Lead form", [
    createFormField("email", "Work email", "email", true),
    createFormField("role", "Role", "select", true, ["Engineering", "Product"])
  ]);

  const invalid = validateFormSubmission(schema, {
    formId: "wrong-form",
    answers: { email: "person@gmail.com", role: "Finance", extra: "ignored" }
  });
  assert.equal(invalid.isValid, false);
  assert.equal(invalid.errors[0].fieldId, "_form");

  const policy = validateFormSubmission(schema, {
    formId: "form-policy",
    answers: { email: "person@gmail.com", role: "Finance", extra: "ignored" }
  });
  assert.equal(policy.isValid, false);
  assert.ok(policy.errors.some((error) => error.message.includes("work email")));
  assert.ok(policy.errors.some((error) => error.message.includes("available options")));
  assert.ok(policy.errors.some((error) => error.fieldId === "extra"));

  const accepted = validateFormSubmission(
    { ...schema, allowNonBusinessEmails: true },
    { formId: "form-policy", answers: { email: "person@gmail.com", role: "Product" } }
  );
  assert.equal(accepted.isValid, true);
});
