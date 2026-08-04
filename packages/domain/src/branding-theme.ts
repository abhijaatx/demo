/**
 * Workspace & Demo Branding Theme Sanitization — TASK-088
 */

export interface BrandingTheme {
  readonly logoUrl: string | null;
  readonly primaryColor: string;
  readonly backgroundColor: string;
  readonly textColor: string;
  readonly borderRadiusPx: number;
  readonly fontFamily: string;
  readonly hidePlatformBranding: boolean;
}

const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}){1,2}$/;
const SAFE_FONT_FAMILIES = ["Inter", "Roboto", "Outfit", "system-ui", "sans-serif", "serif"];

export function sanitizeHexColor(colorStr: unknown, fallback: string): string {
  if (typeof colorStr === "string" && HEX_COLOR_REGEX.test(colorStr.trim())) {
    return colorStr.trim();
  }
  return fallback;
}

export function sanitizeFontFamily(fontStr: unknown, fallback = "Inter"): string {
  if (typeof fontStr === "string" && SAFE_FONT_FAMILIES.includes(fontStr.trim())) {
    return fontStr.trim();
  }
  return fallback;
}

export function parseAndSanitizeBrandingTheme(input: unknown): BrandingTheme {
  const raw = (input ?? {}) as Record<string, unknown>;

  const logoUrl = typeof raw["logoUrl"] === "string" ? raw["logoUrl"] : null;
  const primaryColor = sanitizeHexColor(raw["primaryColor"], "#6366f1");
  const backgroundColor = sanitizeHexColor(raw["backgroundColor"], "#0f172a");
  const textColor = sanitizeHexColor(raw["textColor"], "#f8fafc");

  const numRadius = Number(raw["borderRadiusPx"]);
  const borderRadiusPx = isNaN(numRadius) ? 8 : Math.max(0, Math.min(24, numRadius));

  const fontFamily = sanitizeFontFamily(raw["fontFamily"], "Inter");
  const hidePlatformBranding = Boolean(raw["hidePlatformBranding"]);

  return Object.freeze({
    logoUrl,
    primaryColor,
    backgroundColor,
    textColor,
    borderRadiusPx,
    fontFamily,
    hidePlatformBranding
  });
}
