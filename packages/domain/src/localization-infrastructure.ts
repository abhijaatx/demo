/**
 * Localization Infrastructure, Fallback Chains & RTL Support — TASK-134
 */

export interface DemoTranslationDictionary {
  readonly locale: string;
  readonly translations: Readonly<Record<string, string>>;
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
