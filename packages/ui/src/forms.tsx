"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ChangeEvent, ComponentPropsWithoutRef, FormEvent, ReactNode } from "react";

type FormValues = Record<string, unknown>;
type FieldName<TValues extends FormValues> = Extract<keyof TValues, string>;
export type FieldErrorMap = Record<string, string>;

export type NormalizedServerErrors = {
  fieldErrors: FieldErrorMap;
  formError?: string;
};

export type FormSubmitResult = {
  fieldErrors?: unknown;
  formError?: unknown;
};

export type FormValidationResult<TValues extends FormValues> = {
  fieldErrors?: Partial<Record<FieldName<TValues>, string | string[]>>;
  formError?: string;
};

export type FormOptions<TValues extends FormValues> = {
  initialValues: TValues;
  validate?: ((values: Readonly<TValues>) => FormValidationResult<TValues> | undefined) | undefined;
  onSubmit: (values: Readonly<TValues>) => Promise<FormSubmitResult | void>;
  unsavedMessage?: string | undefined;
};

export type FormState<TValues extends FormValues> = {
  values: TValues;
  fieldErrors: FieldErrorMap;
  formError?: string;
  status: "idle" | "submitting" | "success";
  isSubmitting: boolean;
  isDirty: boolean;
  submitCount: number;
};

export type FieldBinding = {
  id: string;
  name: string;
  value: string;
  onChange: (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  onBlur: () => void;
};

export type CheckboxBinding = Omit<FieldBinding, "value" | "onChange"> & {
  checked: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export type UseFormReturn<TValues extends FormValues> = {
  state: FormState<TValues>;
  values: TValues;
  fieldErrors: FieldErrorMap;
  formError?: string;
  setValue: <K extends FieldName<TValues>>(name: K, value: TValues[K]) => void;
  setValues: (values: TValues) => void;
  setFieldError: (name: string, message: string) => void;
  clearErrors: () => void;
  reset: (values?: TValues) => void;
  markSaved: () => void;
  submit: () => Promise<boolean>;
  getFieldId: (name: string) => string;
  getFieldProps: <K extends FieldName<TValues>>(
    name: K,
    options?: { type?: "text" | "checkbox" }
  ) => FieldBinding | CheckboxBinding;
};

const DEFAULT_FORM_ERROR = "We couldn’t save this form. Check the fields and try again.";
const MAX_FIELDS = 50;
const MAX_MESSAGES_PER_FIELD = 3;
const MAX_MESSAGE_LENGTH = 240;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeMessage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const message = value
    .split("")
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("")
    .trim()
    .slice(0, MAX_MESSAGE_LENGTH);
  return message || undefined;
}

function firstSafeMessage(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    for (const candidate of value.slice(0, MAX_MESSAGES_PER_FIELD)) {
      const message = safeMessage(candidate);
      if (message) return message;
    }
    return undefined;
  }
  return safeMessage(value);
}

export function normalizeServerErrors(payload: unknown): NormalizedServerErrors {
  if (!isRecord(payload)) return { fieldErrors: {} };
  const rawFieldErrors = payload["fieldErrors"];
  const fieldErrors: FieldErrorMap = {};

  if (isRecord(rawFieldErrors)) {
    for (const [field, rawMessage] of Object.entries(rawFieldErrors).slice(0, MAX_FIELDS)) {
      const message = firstSafeMessage(rawMessage);
      if (message) fieldErrors[field] = message;
    }
  }

  const formError = safeMessage(payload["formError"]);
  return formError ? { fieldErrors, formError } : { fieldErrors };
}

function normalizeValidationResult<TValues extends FormValues>(
  result: FormValidationResult<TValues> | undefined
): NormalizedServerErrors {
  if (!result) return { fieldErrors: {} };
  return normalizeServerErrors({ fieldErrors: result.fieldErrors, formError: result.formError });
}

function asInputValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  return typeof value === "string" ? value : String(value);
}

function domFieldId(formId: string, name: string): string {
  const safeName = name.replace(/[^a-zA-Z0-9_-]/gu, "-");
  return `${formId}-${safeName || "field"}`;
}

export function useUnsavedChangesGuard(
  isDirty: boolean,
  message = "You have unsaved changes."
): void {
  useEffect(() => {
    if (!isDirty) return undefined;
    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = message;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty, message]);
}

export function useForm<TValues extends FormValues>({
  initialValues,
  validate,
  onSubmit,
  unsavedMessage
}: FormOptions<TValues>): UseFormReturn<TValues> {
  const formId = `ui-form-${useId().replace(/[^a-zA-Z0-9_-]/gu, "")}`;
  const [values, setValuesState] = useState<TValues>(() => ({ ...initialValues }));
  const [fieldErrors, setFieldErrors] = useState<FieldErrorMap>({});
  const [formError, setFormError] = useState<string | undefined>();
  const [status, setStatus] = useState<FormState<TValues>["status"]>("idle");
  const [isDirty, setIsDirty] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);
  const submittingRef = useRef(false);

  useUnsavedChangesGuard(isDirty, unsavedMessage);

  const getFieldId = useCallback((name: string) => domFieldId(formId, name), [formId]);

  const focusFirstError = useCallback(
    (errors: FieldErrorMap): void => {
      const firstField = Object.keys(errors)[0];
      if (!firstField || typeof document === "undefined") return;
      queueMicrotask(() => document.getElementById(getFieldId(firstField))?.focus());
    },
    [getFieldId]
  );

  const setValue = useCallback(<K extends FieldName<TValues>>(name: K, value: TValues[K]): void => {
    setValuesState((current) => ({ ...current, [name]: value }));
    setIsDirty(true);
    setFieldErrors((current) => {
      if (!(String(name) in current)) return current;
      const next = { ...current };
      delete next[String(name)];
      return next;
    });
    setFormError(undefined);
  }, []);

  const setValues = useCallback((nextValues: TValues): void => {
    setValuesState({ ...nextValues });
    setIsDirty(true);
    setStatus("idle");
  }, []);

  const setFieldError = useCallback((name: string, message: string): void => {
    const normalized = safeMessage(message);
    if (!normalized) return;
    setFieldErrors((current) => ({ ...current, [name]: normalized }));
  }, []);

  const clearErrors = useCallback((): void => {
    setFieldErrors({});
    setFormError(undefined);
  }, []);

  const reset = useCallback(
    (nextValues = initialValues): void => {
      setValuesState({ ...nextValues });
      setFieldErrors({});
      setFormError(undefined);
      setStatus("idle");
      setIsDirty(false);
    },
    [initialValues]
  );

  const markSaved = useCallback((): void => {
    setIsDirty(false);
    setStatus("success");
  }, []);

  const submit = useCallback(async (): Promise<boolean> => {
    if (submittingRef.current) return false;
    submittingRef.current = true;
    setSubmitCount((count) => count + 1);
    setStatus("submitting");
    setFieldErrors({});
    setFormError(undefined);

    const validation = normalizeValidationResult(validate?.(values));
    if (Object.keys(validation.fieldErrors).length > 0 || validation.formError) {
      setFieldErrors(validation.fieldErrors);
      setFormError(validation.formError);
      setStatus("idle");
      focusFirstError(validation.fieldErrors);
      submittingRef.current = false;
      return false;
    }

    try {
      const result = await onSubmit(values);
      const serverErrors = normalizeServerErrors(result);
      if (Object.keys(serverErrors.fieldErrors).length > 0 || serverErrors.formError) {
        setFieldErrors(serverErrors.fieldErrors);
        setFormError(serverErrors.formError);
        setStatus("idle");
        focusFirstError(serverErrors.fieldErrors);
        return false;
      }
      setIsDirty(false);
      setStatus("success");
      return true;
    } catch {
      setFormError(DEFAULT_FORM_ERROR);
      setStatus("idle");
      return false;
    } finally {
      submittingRef.current = false;
    }
  }, [focusFirstError, onSubmit, validate, values]);

  const getFieldProps = useCallback(
    <K extends FieldName<TValues>>(
      name: K,
      options?: { type?: "text" | "checkbox" }
    ): FieldBinding | CheckboxBinding => {
      const fieldName = String(name);
      const common = {
        id: getFieldId(fieldName),
        name: fieldName,
        onBlur: () => undefined
      };
      if (options?.type === "checkbox") {
        return {
          ...common,
          checked: Boolean(values[name]),
          onChange: (event: ChangeEvent<HTMLInputElement>) =>
            setValue(name, event.currentTarget.checked as TValues[K])
        };
      }
      return {
        ...common,
        value: asInputValue(values[name]),
        onChange: (
          event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
        ) => setValue(name, event.currentTarget.value as TValues[K])
      };
    },
    [getFieldId, setValue, values]
  );

  return {
    state: {
      values,
      fieldErrors,
      ...(formError ? { formError } : {}),
      status,
      isSubmitting: status === "submitting",
      isDirty,
      submitCount
    },
    values,
    fieldErrors,
    ...(formError ? { formError } : {}),
    setValue,
    setValues,
    setFieldError,
    clearErrors,
    reset,
    markSaved,
    submit,
    getFieldId,
    getFieldProps
  };
}

export type FormProps<TValues extends FormValues> = Omit<
  ComponentPropsWithoutRef<"form">,
  "children" | "onSubmit"
> & {
  form: UseFormReturn<TValues>;
  children: ReactNode;
};

export function Form<TValues extends FormValues>({ form, children, ...props }: FormProps<TValues>) {
  const onSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    void form.submit();
  };
  return (
    <form
      {...props}
      className={props.className}
      noValidate
      onSubmit={onSubmit}
      aria-busy={form.state.isSubmitting || undefined}
    >
      {children}
    </form>
  );
}

export type FormErrorSummaryProps = {
  fieldErrors: FieldErrorMap;
  formError?: string | undefined;
  fieldLabels?: Record<string, string> | undefined;
  getFieldId?: ((name: string) => string) | undefined;
  title?: string;
};

export function FormErrorSummary({
  fieldErrors,
  formError,
  fieldLabels = {},
  getFieldId = (name) => domFieldId("field", name),
  title = "Please fix the highlighted fields"
}: FormErrorSummaryProps) {
  const summaryRef = useRef<HTMLDivElement>(null);
  const hasErrors = Boolean(formError) || Object.keys(fieldErrors).length > 0;

  useEffect(() => {
    if (!hasErrors) return;
    summaryRef.current?.querySelector<HTMLAnchorElement>("a")?.focus();
  }, [hasErrors]);

  if (!hasErrors) return null;
  return (
    <div
      ref={summaryRef}
      className="ui-form-error-summary"
      role="alert"
      aria-labelledby="ui-form-error-summary-title"
    >
      <h2 id="ui-form-error-summary-title">{title}</h2>
      {formError ? <p>{formError}</p> : null}
      {Object.entries(fieldErrors).length > 0 ? (
        <ul>
          {Object.entries(fieldErrors).map(([field, message]) => (
            <li key={field}>
              <a href={`#${getFieldId(field)}`}>
                {fieldLabels[field] ?? field}: {message}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export type FieldDescriptionProps = {
  id: string;
  children: ReactNode;
};

export function FieldDescription({ id, children }: FieldDescriptionProps) {
  return (
    <div id={id} className="ui-field-description">
      {children}
    </div>
  );
}

export type FieldErrorProps = {
  id: string;
  children: ReactNode;
};

export function FieldError({ id, children }: FieldErrorProps) {
  return (
    <div id={id} className="ui-field-error" role="alert">
      {children}
    </div>
  );
}
