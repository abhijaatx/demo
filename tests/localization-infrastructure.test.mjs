import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isRtlLocale,
  parseDemoTranslation,
  resolveLocalizedText,
  translationContentKey
} from "@supademo/domain";

test("isRtlLocale detects Right-to-Left languages", () => {
  assert.equal(isRtlLocale("ar-SA"), true);
  assert.equal(isRtlLocale("he"), true);
  assert.equal(isRtlLocale("en-US"), false);
  assert.equal(isRtlLocale("es-ES"), false);
});

test("resolveLocalizedText follows target locale -> default fallback -> default text chain", () => {
  const dicts = [
    { locale: "en-US", translations: { step1: "Click Here", step2: "Next" } },
    { locale: "es-ES", translations: { step1: "Haga clic aquí" } }
  ];

  // Exact target match
  assert.equal(resolveLocalizedText("step1", "es-ES", dicts), "Haga clic aquí");
  // Target missing, falls back to default locale (en-US)
  assert.equal(resolveLocalizedText("step2", "es-ES", dicts), "Next");
  // Content missing everywhere, returns defaultText
  assert.equal(resolveLocalizedText("step3", "es-ES", dicts, "en-US", "Default"), "Default");
});

test("parseDemoTranslation bounds untrusted dictionaries and preserves stable content keys", () => {
  const parsed = parseDemoTranslation({
    locale: "fr-FR",
    translations: {
      [translationContentKey("step", "step-1", "title")]: "Bienvenue {{name}}",
      "<script>alert(1)</script>": "safe text"
    }
  });

  assert.equal(parsed?.locale, "fr-FR");
  assert.equal(parsed?.sourceLocale, "en-US");
  assert.equal(parsed?.translations["step:step-1:title"], "Bienvenue {{name}}");
  assert.equal(Object.keys(parsed?.translations ?? {}).length, 2);
});
