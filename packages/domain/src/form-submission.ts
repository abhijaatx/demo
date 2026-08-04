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

  schema.fields.forEach((field) => {
    const rawVal = submission.answers[field.id];
    const val = typeof rawVal === "string" ? rawVal.trim() : "";

    if (field.isRequired && !val) {
      errors.push({ fieldId: field.id, message: `${field.label} is required.` });
    } else if (val && field.fieldType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(val)) {
        errors.push({ fieldId: field.id, message: `Invalid email address format.` });
      }
    }
  });

  return Object.freeze({
    isValid: errors.length === 0,
    errors: Object.freeze(errors)
  });
}
