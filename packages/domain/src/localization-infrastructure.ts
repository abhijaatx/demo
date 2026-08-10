/**
 * Localization Infrastructure, Fallback Chains & RTL Support — TASK-134
 */

export interface DemoTranslationDictionary {
  readonly locale: string;
  readonly sourceLocale?: string;
  readonly createdAtIso?: string;
  readonly translations: Readonly<Record<string, string>>;
}

export const SUPPORTED_TRANSLATION_LOCALES = Object.freeze([
  { locale: "es-ES", label: "Spanish" },
  { locale: "fr-FR", label: "French" },
  { locale: "de-DE", label: "German" },
  { locale: "pt-BR", label: "Portuguese" },
  { locale: "it-IT", label: "Italian" },
  { locale: "ja-JP", label: "Japanese" },
  { locale: "ko-KR", label: "Korean" },
  { locale: "zh-CN", label: "Chinese" },
  { locale: "ar-SA", label: "Arabic" }
] as const);

const MAX_TRANSLATION_LOCALE_LENGTH = 64;
const MAX_TRANSLATION_ENTRIES = 600;
const MAX_TRANSLATION_KEY_LENGTH = 160;
const MAX_TRANSLATION_VALUE_LENGTH = 4_000;

function boundedPlainText(value: unknown, maximum: number): string {
  if (typeof value !== "string") return "";
  const withoutControls = Array.from(value)
    .filter((character) => {
      const code = character.codePointAt(0) ?? 0;
      return !(
        (code >= 0 && code <= 8) ||
        code === 11 ||
        code === 12 ||
        (code >= 14 && code <= 31) ||
        code === 127
      );
    })
    .join("");
  return withoutControls.slice(0, maximum).trim();
}

export function parseDemoTranslation(input: unknown): DemoTranslationDictionary | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as Record<string, unknown>;
  const locale = boundedPlainText(raw["locale"], MAX_TRANSLATION_LOCALE_LENGTH);
  if (!locale) return null;
  const sourceLocale =
    boundedPlainText(raw["sourceLocale"], MAX_TRANSLATION_LOCALE_LENGTH) || "en-US";
  const rawTranslations =
    typeof raw["translations"] === "object" && raw["translations"] !== null
      ? (raw["translations"] as Record<string, unknown>)
      : {};
  const translations = Object.fromEntries(
    Object.entries(rawTranslations)
      .slice(0, MAX_TRANSLATION_ENTRIES)
      .map(([key, value]) => [
        boundedPlainText(key, MAX_TRANSLATION_KEY_LENGTH),
        boundedPlainText(value, MAX_TRANSLATION_VALUE_LENGTH)
      ])
      .filter(([key, value]) => Boolean(key) && Boolean(value))
  );

  const createdAtIso =
    typeof raw["createdAtIso"] === "string" ? raw["createdAtIso"].slice(0, 64) : null;
  return Object.freeze({
    locale,
    sourceLocale,
    ...(createdAtIso ? { createdAtIso } : {}),
    translations: Object.freeze(translations)
  });
}

export function translationContentKey(
  scope: "step" | "chapter",
  id: string,
  field: string,
  childId?: string
): string {
  const boundedId = id.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 128);
  const boundedField = field.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 64);
  const boundedChild = childId ? `:${childId.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 128)}` : "";
  return `${scope}:${boundedId}:${boundedField}${boundedChild}`;
}

export function translationLabelForLocale(locale: string): string {
  const normalized = locale.trim().toLowerCase();
  return (
    SUPPORTED_TRANSLATION_LOCALES.find((option) => option.locale.toLowerCase() === normalized)
      ?.label ?? locale
  );
}

export function isRtlLocale(locale: string): boolean {
  const code = locale.toLowerCase().split("-")[0];
  return ["ar", "he", "fa", "ur"].includes(code ?? "");
}

export function resolveLocalizedText(
  contentId: string,
  targetLocale: string,
  dictionaries: readonly DemoTranslationDictionary[],
  defaultLocale = "en-US",
  defaultText = ""
): string {
  const targetDict = dictionaries.find(
    (d) => d.locale.toLowerCase() === targetLocale.toLowerCase()
  );
  if (targetDict && targetDict.translations[contentId]) {
    return targetDict.translations[contentId]!;
  }

  const fallbackDict = dictionaries.find(
    (d) => d.locale.toLowerCase() === defaultLocale.toLowerCase()
  );
  if (fallbackDict && fallbackDict.translations[contentId]) {
    return fallbackDict.translations[contentId]!;
  }

  return defaultText;
}
