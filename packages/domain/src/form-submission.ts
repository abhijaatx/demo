/**
 * Secure Form & Quiz Submission Validation Engine — TASK-123
 */

import type { DemoFormSchema } from "./form-schemas.js";

export interface FormSubmissionPayload {
  readonly formId: string;
  readonly answers: Readonly<Record<string, string>>;
}

export interface FormSubmissionValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly { readonly fieldId: string; readonly message: string }[];
}

export function validateFormSubmission(
  schema: DemoFormSchema,
  submission: FormSubmissionPayload
): FormSubmissionValidationResult {
  const errors: { fieldId: string; message: string }[] = [];

  if (submission.formId !== schema.formId) {
    return Object.freeze({
      isValid: false,
      errors: Object.freeze([{ fieldId: "_form", message: "This form is no longer available." }])
    });
  }

  const allowedFieldIds = new Set(schema.fields.map((field) => field.id));
  Object.keys(submission.answers).forEach((fieldId) => {
    if (!allowedFieldIds.has(fieldId)) {
      errors.push({ fieldId, message: "This field is not part of the form." });
    }
  });

  schema.fields.forEach((field) => {
    const rawVal = submission.answers[field.id];
    const val = typeof rawVal === "string" ? rawVal.trim().slice(0, 2_000) : "";

    if (field.isRequired && !val) {
      errors.push({ fieldId: field.id, message: `${field.label} is required.` });
    } else if (val && field.fieldType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        errors.push({ fieldId: field.id, message: `Invalid email address format.` });
      } else if (!schema.allowNonBusinessEmails && isFreeEmailDomain(val)) {
        errors.push({ fieldId: field.id, message: "Please use a work email address." });
      }
    } else if (val && ["select", "radio"].includes(field.fieldType)) {
      if (!field.options.includes(val)) {
        errors.push({ fieldId: field.id, message: "Choose one of the available options." });
      }
    } else if (val && field.fieldType === "checkbox" && !["true", "false"].includes(val)) {
      errors.push({ fieldId: field.id, message: "Choose a valid checkbox value." });
    }
  });

  return Object.freeze({
    isValid: errors.length === 0,
    errors: Object.freeze(errors)
  });
}

function isFreeEmailDomain(value: string): boolean {
  const domain = value.split("@")[1]?.toLowerCase() ?? "";
  return new Set([
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "proton.me",
    "protonmail.com"
  ]).has(domain);
}
