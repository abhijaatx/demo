import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { createThemeOverrides, designTokens } from "../packages/ui/dist/index.js";

const readCss = () => readFile(new URL("../apps/web/app/globals.css", import.meta.url), "utf8");

function channel(value) {
  const normalized = value.length === 4 ? value.replace(/(.)/gu, "$1$1") : value;
  return Number.parseInt(normalized, 16) / 255;
}

function luminance(hex) {
  const channels = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map(channel);
  const weights = [0.2126, 0.7152, 0.0722];
  return channels.reduce(
    (sum, value, index) =>
      sum + (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) * weights[index],
    0
  );
}

function contrast(first, second) {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

test("light and dark text/status pairings meet the AA contrast floor", () => {
  for (const theme of [designTokens.color.light, designTokens.color.dark]) {
    assert.ok(contrast(theme.textPrimary, theme.canvas) >= 4.5);
    assert.ok(contrast(theme.textSecondary, theme.surface) >= 4.5);
    assert.ok(contrast(theme.brand, theme.onBrand) >= 4.5);
    assert.ok(contrast(theme.success, theme.surface) >= 4.5);
    assert.ok(contrast(theme.warning, theme.surface) >= 4.5);
    assert.ok(contrast(theme.danger, theme.surface) >= 4.5);
  }

  for (const palette of Object.values(designTokens.brand)) {
    for (const mode of Object.values(palette)) {
      assert.ok(contrast(mode.brand, mode.onBrand) >= 4.5);
    }
  }
});

test("theme override values are allowlisted and immutable", () => {
  const overrides = createThemeOverrides({
    ["--color-brand"]: "#7356c7",
    ["--color-brand-strong"]: "#5a3cae"
  });

  assert.equal(overrides["--color-brand"], "#7356c7");
  assert.ok(Object.isFrozen(overrides));
  assert.throws(() => {
    overrides["--color-brand"] = "red";
  }, TypeError);
});

test("CSS exposes controlled theme and brand hooks and consumes semantic variables", async () => {
  const css = await readCss();

  assert.match(css, /:root\[data-theme="dark"\]/u);
  assert.match(css, /:root\[data-brand="violet"\]/u);
  assert.match(
    css,
    /button:focus-visible\s*,\s*a:focus-visible\s*\{\s*outline: 3px solid var\(--color-focus-ring\)/u
  );
  assert.doesNotMatch(css, /\.button-primary[^}]*#[0-9a-f]/iu);
  assert.doesNotMatch(css, /\.panel[^}]*rgb\(/iu);
});
