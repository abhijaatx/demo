/**
 * Form & Survey Field Palette Editor — TASK-122
 */

import type { DemoFormSchema, FormField } from "./form-schemas.js";

export function addFormField(schema: DemoFormSchema, field: FormField): DemoFormSchema {
  if (schema.fields.some((f) => f.id === field.id)) {
    throw new Error(`Field with id '${field.id}' already exists in form.`);
  }

  return Object.freeze({
    ...schema,
    fields: Object.freeze([...schema.fields, field])
  });
}

export function removeFormField(schema: DemoFormSchema, fieldId: string): DemoFormSchema {
  const filtered = schema.fields.filter((f) => f.id !== fieldId);
  return Object.freeze({
    ...schema,
    fields: Object.freeze(filtered)
  });
}

export function reorderFormFields(
  schema: DemoFormSchema,
  fieldId: string,
  targetIndex: number
): DemoFormSchema {
  const fields = [...schema.fields];
  const currentIndex = fields.findIndex((f) => f.id === fieldId);
  if (currentIndex === -1) return schema;

  const [removed] = fields.splice(currentIndex, 1);
  if (!removed) return schema;

  const boundedIndex = Math.max(0, Math.min(fields.length, targetIndex));
  fields.splice(boundedIndex, 0, removed);

  return Object.freeze({
    ...schema,
    fields: Object.freeze(fields)
  });
}
