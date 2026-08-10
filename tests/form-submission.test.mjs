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

test("validateFormSubmission rejects emails from blocked domains (case-insensitive exact match)", () => {
  const schema = createDemoFormSchema(
    "form-blocked",
    "Lead",
    [createFormField("email", "Email", "email", true)],
    { blockedEmailDomains: ["spam.com"] }
  );

  const blocked = validateFormSubmission(schema, {
    formId: "form-blocked",
    answers: { email: "user@Spam.COM" }
  });
  assert.equal(blocked.isValid, false);
  assert.equal(blocked.errors[0].message, "This email domain is not accepted.");

  const accepted = validateFormSubmission(schema, {
    formId: "form-blocked",
    answers: { email: "user@acme.com" }
  });
  assert.equal(accepted.isValid, true);
});

test("validateFormSubmission enforces an allowlist when present and supersedes the business rule", () => {
  const schema = createDemoFormSchema(
    "form-allow",
    "Lead",
    [createFormField("email", "Email", "email", true)],
    { allowedEmailDomains: ["acme.com"] }
  );

  // A free-email address outside the allowlist fails with the allowlist message.
  const outside = validateFormSubmission(schema, {
    formId: "form-allow",
    answers: { email: "person@gmail.com" }
  });
  assert.equal(outside.isValid, false);
  assert.equal(outside.errors[0].message, "Use an email address from an approved domain.");

  const inside = validateFormSubmission(schema, {
    formId: "form-allow",
    answers: { email: "person@ACME.com" }
  });
  assert.equal(inside.isValid, true);
});

test("validateFormSubmission applies blocked precedence over allowlist and leaves non-email fields alone", () => {
  const schema = createDemoFormSchema(
    "form-precedence",
    "Lead",
    [
      createFormField("email", "Email", "email", true),
      createFormField("name", "Name", "text", true)
    ],
    {
      allowedEmailDomains: ["acme.com", "spam.com"],
      blockedEmailDomains: ["spam.com"]
    }
  );

  // A domain on both lists is rejected (blocked wins).
  const blocked = validateFormSubmission(schema, {
    formId: "form-precedence",
    answers: { email: "user@spam.com", name: "Ada" }
  });
  assert.equal(blocked.isValid, false);
  assert.equal(blocked.errors[0].message, "This email domain is not accepted.");

  // Non-email fields and valid allowlisted emails are unaffected.
  const accepted = validateFormSubmission(schema, {
    formId: "form-precedence",
    answers: { email: "user@acme.com", name: "Ada" }
  });
  assert.equal(accepted.isValid, true);

  // An invalid email format still fails before domain policy.
  const malformed = validateFormSubmission(schema, {
    formId: "form-precedence",
    answers: { email: "not-an-email", name: "Ada" }
  });
  assert.equal(malformed.isValid, false);
  assert.equal(malformed.errors[0].message, "Invalid email address format.");
});
