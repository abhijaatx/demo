# Forms architecture

TASK-016 provides a shared form contract for future creator and workspace forms. It does not choose a schema library or backend API client; callers supply typed values, client validation, and an async submit function.

## Submit contract

```tsx
type ProfileValues = { name: string; email: string };

const form = useForm<ProfileValues>({
  initialValues: { name: "", email: "" },
  validate: (values) => ({
    fieldErrors: values.email.includes("@") ? undefined : { email: "Enter a valid email." }
  }),
  onSubmit: async (values) => {
    const response = await saveProfile(values);
    if (!response.ok) return await response.json();
  }
});
```

`useForm` owns submitting state, dirty state, validation mapping, safe server-error normalization, reset/mark-saved behavior, and the submit count. It never logs values. On client or server validation failure, values remain unchanged and the first invalid field is focused through its generated stable ID.

The accepted server error shape is deliberately narrow:

```json
{
  "fieldErrors": { "email": "Enter a valid email." },
  "formError": "Please review the highlighted fields."
}
```

Messages are trimmed, control characters are removed, field count/messages are capped, and unknown thrown errors become a generic form-level message. Do not return stack traces, database errors, tokens, or personal data in `fieldErrors` or `formError`.

## Rendering and accessibility

Wrap a form with `Form`, pass `form.getFieldProps(name)` to a native control, and render `FormErrorSummary` near the top of the form. `FieldDescription` and `FieldError` provide reusable IDs for `aria-describedby` and alert semantics.

```tsx
<Form form={form}>
  <FormErrorSummary
    fieldErrors={form.fieldErrors}
    formError={form.formError}
    getFieldId={form.getFieldId}
  />
  <Input label="Email" {...form.getFieldProps("email")} />
  <Button type="submit" loading={form.state.isSubmitting}>
    Save
  </Button>
</Form>
```

Use `getFieldProps(name, { type: "checkbox" })` for checkbox values. The dirty-state guard protects against browser tab close/refresh while changes are unsaved; route-specific navigation blockers should be added when the application router and destructive navigation flows are established.
