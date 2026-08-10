/**
 * Form, Survey & Quiz Field Schemas — TASK-121
 *
 * Forms are stored as part of a chapter.  The parser deliberately keeps the
 * schema small and bounded because these values can originate in a browser
 * editor or a public viewer submission.
 */

import { validateSafeUrl } from "./hotspot-schema.js";

export type FormFieldType = "text" | "email" | "select" | "radio" | "checkbox";
export type FormLayout = "left" | "center" | "right";
export type FormTheme = "light" | "dark" | "custom";

export type DemoFormSchemaOptions = Readonly<{
  allowSkip?: boolean;
  allowNonBusinessEmails?: boolean;
  allowedEmailDomains?: readonly string[];
  blockedEmailDomains?: readonly string[];
  layout?: FormLayout;
  theme?: FormTheme;
  backgroundColor?: string | null;
  backgroundImageUrl?: string | null;
  opacity?: number;
  blurPx?: number;
}>;

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
  readonly allowSkip: boolean;
  readonly allowNonBusinessEmails: boolean;
  readonly allowedEmailDomains: readonly string[];
  readonly blockedEmailDomains: readonly string[];
  readonly layout: FormLayout;
  readonly theme: FormTheme;
  readonly backgroundColor: string | null;
  readonly backgroundImageUrl: string | null;
  readonly opacity: number;
  readonly blurPx: number;
}

const MAX_FORM_ID_LENGTH = 128;
const MAX_FORM_TITLE_LENGTH = 160;
const MAX_FIELD_COUNT = 7;
const MAX_FIELD_ID_LENGTH = 128;
const MAX_FIELD_LABEL_LENGTH = 160;
const MAX_OPTION_COUNT = 20;
const MAX_OPTION_LENGTH = 120;
const MAX_EMAIL_DOMAIN_COUNT = 25;
const MAX_EMAIL_DOMAIN_LENGTH = 253;
const MAX_EMAIL_DOMAIN_LABEL_LENGTH = 63;

/** Plain DNS hostname token: lowercase labels of alphanumerics/hyphens separated by dots. */
const EMAIL_DOMAIN_TOKEN_REGEX =
  /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*$/u;

function bounded(value: unknown, maximum: number): string {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

/** Allowlisted 6-digit hex color used for chapter and form backgrounds. */
export function safeColor(value: unknown): string | null {
  return typeof value === "string" && /^#[0-9a-fA-F]{6}$/u.test(value) ? value : null;
}

/** Clamp a numeric value to [minimum, maximum], falling back when malformed. */
export function boundedRange(
  value: unknown,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(maximum, Math.max(minimum, value));
}

/**
 * Reject anything that is not a plain, fully-qualified DNS hostname: schemes,
 * paths, @, wildcards, credentials, whitespace/control characters, IPv4
 * literals, and single-label internal names are all excluded.
 */
function isPlainDnsHostname(token: string): boolean {
  if (!token || token.length > MAX_EMAIL_DOMAIN_LENGTH) return false;
  if (!EMAIL_DOMAIN_TOKEN_REGEX.test(token)) return false;
  const labels = token.split(".");
  // Require a fully-qualified name (at least one dot) and sane label lengths.
  if (labels.length < 2) return false;
  if (labels.some((label) => label.length > MAX_EMAIL_DOMAIN_LABEL_LENGTH)) return false;
  // Reject IPv4 literals (every label numeric) — not a plain hostname.
  if (labels.every((label) => /^[0-9]+$/u.test(label))) return false;
  if (token === "localhost" || token === "local") return false;
  return true;
}

/**
 * Normalize a list of email domains (accepts a comma-separated string or an
 * array of raw tokens) into a bounded, frozen array of lowercase plain DNS
 * hostnames. Malformed, unsafe, or oversized tokens are dropped; when absent
 * the result is an empty array (backwards compatible).
 */
export function normalizeEmailDomainList(
  value: unknown,
  maximum: number = MAX_EMAIL_DOMAIN_COUNT
): readonly string[] {
  // Callers cannot bypass the count bound: the requested maximum is capped at
  // the canonical limit and malformed/negative values fall back safely.
  const effectiveMaximum =
    typeof maximum === "number" && Number.isFinite(maximum)
      ? Math.min(MAX_EMAIL_DOMAIN_COUNT, Math.max(0, Math.floor(maximum)))
      : MAX_EMAIL_DOMAIN_COUNT;
  const candidates: unknown[] =
    typeof value === "string" ? value.split(",") : Array.isArray(value) ? value : [];
  const tokens: string[] = [];
  for (const candidate of candidates) {
    if (tokens.length >= effectiveMaximum) break;
    if (typeof candidate !== "string") continue;
    // Validate the trimmed token at full length first; oversized original
    // tokens are dropped, never truncated into an accepted hostname.
    const token = candidate.trim().toLowerCase();
    if (token.length > MAX_EMAIL_DOMAIN_LENGTH) continue;
    if (isPlainDnsHostname(token) && !tokens.includes(token)) tokens.push(token);
  }
  return Object.freeze(tokens);
}

function normalizeField(field: FormField): FormField {
  const id = bounded(field.id, MAX_FIELD_ID_LENGTH);
  const label = bounded(field.label, MAX_FIELD_LABEL_LENGTH);
  if (!id || !label) throw new Error("Form field id and label must be non-empty strings.");
  const validTypes: FormFieldType[] = ["text", "email", "select", "radio", "checkbox"];
  const fieldType = validTypes.includes(field.fieldType) ? field.fieldType : "text";
  const options = ["select", "radio"].includes(fieldType)
    ? field.options
        .filter((option): option is string => typeof option === "string")
        .map((option) => option.trim().slice(0, MAX_OPTION_LENGTH))
        .filter(Boolean)
        .slice(0, MAX_OPTION_COUNT)
    : [];
  return Object.freeze({
    id,
    label,
    fieldType,
    isRequired: Boolean(field.isRequired),
    options: Object.freeze(options)
  });
}

export function createFormField(
  id: string,
  label: string,
  fieldType: FormFieldType = "text",
  isRequired = false,
  options: readonly string[] = []
): FormField {
  return normalizeField({
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
  fields: readonly FormField[],
  options: DemoFormSchemaOptions = {}
): DemoFormSchema {
  const normalizedFormId = bounded(formId, MAX_FORM_ID_LENGTH);
  const normalizedTitle = bounded(title, MAX_FORM_TITLE_LENGTH);
  if (!normalizedFormId || !normalizedTitle) {
    throw new Error("DemoFormSchema formId and title must be non-empty strings.");
  }

  const normalizedFields = fields.slice(0, MAX_FIELD_COUNT).map(normalizeField);
  const layout: FormLayout = ["left", "center", "right"].includes(options.layout as FormLayout)
    ? (options.layout as FormLayout)
    : "center";
  const theme: FormTheme = ["light", "dark", "custom"].includes(options.theme as FormTheme)
    ? (options.theme as FormTheme)
    : "light";
  const backgroundImageUrl = options.backgroundImageUrl
    ? options.backgroundImageUrl.startsWith("blob:")
      ? options.backgroundImageUrl
      : validateSafeUrl(options.backgroundImageUrl)
    : null;

  return Object.freeze({
    formId: normalizedFormId,
    title: normalizedTitle,
    fields: Object.freeze(normalizedFields),
    allowSkip: Boolean(options.allowSkip),
    allowNonBusinessEmails: Boolean(options.allowNonBusinessEmails),
    allowedEmailDomains: normalizeEmailDomainList(options.allowedEmailDomains),
    blockedEmailDomains: normalizeEmailDomainList(options.blockedEmailDomains),
    layout,
    theme,
    backgroundColor: safeColor(options.backgroundColor),
    backgroundImageUrl,
    opacity: boundedRange(options.opacity, 0.2, 1, 0.92),
    blurPx: Math.round(boundedRange(options.blurPx, 0, 24, 0))
  });
}

/** Parse untrusted serialized form data. Invalid forms fail closed to null. */
export function parseDemoFormSchema(input: unknown): DemoFormSchema | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  const fieldsRaw = Array.isArray(raw["fields"]) ? raw["fields"] : [];
  const fields = fieldsRaw.slice(0, MAX_FIELD_COUNT).flatMap((rawField) => {
    if (typeof rawField !== "object" || rawField === null) return [];
    const field = rawField as Record<string, unknown>;
    const fieldType = String(field["fieldType"] ?? "text") as FormFieldType;
    const options = Array.isArray(field["options"])
      ? field["options"].filter((value): value is string => typeof value === "string")
      : [];
    try {
      return [
        createFormField(
          bounded(field["id"], MAX_FIELD_ID_LENGTH),
          bounded(field["label"], MAX_FIELD_LABEL_LENGTH),
          fieldType,
          Boolean(field["isRequired"]),
          options
        )
      ];
    } catch {
      return [];
    }
  });
  try {
    return createDemoFormSchema(
      bounded(raw["formId"], MAX_FORM_ID_LENGTH),
      bounded(raw["title"], MAX_FORM_TITLE_LENGTH) || "Lead capture",
      fields,
      {
        allowSkip: Boolean(raw["allowSkip"]),
        allowNonBusinessEmails: Boolean(raw["allowNonBusinessEmails"]),
        allowedEmailDomains: normalizeEmailDomainList(raw["allowedEmailDomains"]),
        blockedEmailDomains: normalizeEmailDomainList(raw["blockedEmailDomains"]),
        layout: raw["layout"] as FormLayout,
        theme: raw["theme"] as FormTheme,
        backgroundColor: safeColor(raw["backgroundColor"]),
        backgroundImageUrl:
          typeof raw["backgroundImageUrl"] === "string" ? raw["backgroundImageUrl"] : null,
        opacity: raw["opacity"] as number,
        blurPx: raw["blurPx"] as number
      }
    );
  } catch {
    return null;
  }
}

export const FORM_FIELD_LIMIT = MAX_FIELD_COUNT;
