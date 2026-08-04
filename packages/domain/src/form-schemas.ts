/**
 * Form, Survey & Quiz Field Schemas — TASK-121
 */

export type FormFieldType = "text" | "email" | "select" | "radio" | "checkbox";

export interface FormField {
  readonly id: string;
  readonly label: string;
  readonly fieldType: FormFieldType;
  readonly isRequired: boolean;
  readonly options: readonly string[];
}

export interface DemoFormSchema {
  readonly formId: string;
  readonly title: string;
  readonly fields: readonly FormField[];
}

export function createFormField(
  id: string,
  label: string,
  fieldType: FormFieldType = "text",
  isRequired = false,
  options: readonly string[] = []
): FormField {
  if (!id.trim() || !label.trim()) {
    throw new Error("FormField id and label must be non-empty strings.");
  }

  return Object.freeze({
    id: id.trim(),
    label: label.trim(),
    fieldType,
    isRequired: Boolean(isRequired),
    options: Object.freeze([...options])
  });
}

export function createDemoFormSchema(
  formId: string,
  title: string,
  fields: readonly FormField[]
): DemoFormSchema {
  if (!formId.trim() || !title.trim()) {
    throw new Error("DemoFormSchema formId and title must be non-empty strings.");
  }

  return Object.freeze({
    formId: formId.trim(),
    title: title.trim(),
    fields: Object.freeze([...fields])
  });
}
