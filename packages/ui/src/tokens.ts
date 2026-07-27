export const designTokens = {
  color: {
    light: {
      canvas: "#f7f8fb",
      surface: "#ffffff",
      surfaceRaised: "#ffffff",
      textPrimary: "#172033",
      textSecondary: "#596579",
      textTertiary: "#667085",
      border: "#e4e8f0",
      brand: "#4169e1",
      brandStrong: "#2e51c6",
      brandSubtle: "#edf1ff",
      onBrand: "#ffffff",
      success: "#197a58",
      successSubtle: "#eaf7f1",
      warning: "#8a5a0c",
      warningSubtle: "#fff4df",
      danger: "#b42318",
      dangerSubtle: "#fef3f2",
      focus: "#4169e1"
    },
    dark: {
      canvas: "#111827",
      surface: "#182235",
      surfaceRaised: "#202c43",
      textPrimary: "#f7f9fc",
      textSecondary: "#c4ccda",
      textTertiary: "#9da9bc",
      border: "#354158",
      brand: "#91a8ff",
      brandStrong: "#b5c3ff",
      brandSubtle: "#28375d",
      onBrand: "#10182b",
      success: "#6fd3a8",
      successSubtle: "#173f35",
      warning: "#f4c36e",
      warningSubtle: "#4a3517",
      danger: "#ff8a80",
      dangerSubtle: "#5b1f22",
      focus: "#b5c3ff"
    }
  },
  brand: {
    blue: {
      light: {
        brand: "#4169e1",
        brandStrong: "#2e51c6",
        brandSubtle: "#edf1ff",
        onBrand: "#ffffff",
        focus: "#4169e1"
      },
      dark: {
        brand: "#91a8ff",
        brandStrong: "#b5c3ff",
        brandSubtle: "#28375d",
        onBrand: "#10182b",
        focus: "#b5c3ff"
      }
    },
    violet: {
      light: {
        brand: "#7356c7",
        brandStrong: "#5a3cae",
        brandSubtle: "#f0ebff",
        onBrand: "#ffffff",
        focus: "#7356c7"
      },
      dark: {
        brand: "#b7a1ff",
        brandStrong: "#cfbeff",
        brandSubtle: "#3b2d65",
        onBrand: "#171126",
        focus: "#c9b8ff"
      }
    }
  },
  typography: {
    familySans:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    sizeXs: "10px",
    sizeSm: "11px",
    sizeMd: "12px",
    sizeLg: "16px",
    sizeXl: "19px",
    size2xl: "22px",
    size3xl: "24px",
    sizeDisplay: "clamp(38px, 4vw, 60px)",
    weightRegular: 400,
    weightMedium: 600,
    weightSemibold: 700,
    weightBold: 800,
    lineTight: 1.03,
    lineBody: 1.55,
    lineRelaxed: 1.65
  },
  spacing: {
    "1": "4px",
    "2": "8px",
    "3": "12px",
    "4": "16px",
    "5": "20px",
    "6": "24px",
    "7": "32px",
    "8": "40px",
    "9": "48px",
    "10": "56px",
    "11": "72px"
  },
  radius: {
    sm: "5px",
    md: "8px",
    lg: "10px",
    xl: "16px",
    pill: "999px"
  },
  shadow: {
    sm: "0 5px 20px rgb(24 32 51 / 3%)",
    md: "0 12px 32px rgb(24 32 51 / 6%)",
    button: "0 9px 18px rgb(65 105 225 / 18%)",
    focus: "0 0 0 3px rgb(65 105 225 / 35%)"
  },
  motion: {
    fast: "150ms",
    normal: "200ms",
    skeleton: "1.3s",
    easing: "cubic-bezier(0.2, 0.8, 0.2, 1)"
  },
  zIndex: {
    base: 0,
    sidebar: 10,
    sticky: 20,
    overlay: 100
  },
  breakpoint: {
    mobile: "520px",
    tablet: "800px",
    desktop: "1050px",
    wide: "1280px"
  }
} as const;

export const themeTokenNames = {
  canvas: "--color-canvas",
  surface: "--color-surface",
  surfaceRaised: "--color-surface-raised",
  textPrimary: "--color-text-primary",
  textSecondary: "--color-text-secondary",
  textTertiary: "--color-text-tertiary",
  border: "--color-border",
  brand: "--color-brand",
  brandStrong: "--color-brand-strong",
  brandSubtle: "--color-brand-subtle",
  onBrand: "--color-on-brand",
  success: "--color-success",
  warning: "--color-warning",
  danger: "--color-danger",
  focus: "--color-focus",
  focusRing: "--color-focus-ring",
  brandRgb: "--color-brand-rgb"
} as const;

export type ThemeToken = (typeof themeTokenNames)[keyof typeof themeTokenNames];
export type ThemeOverrides = Partial<Record<ThemeToken, string>>;

export function createThemeOverrides(overrides: ThemeOverrides): Readonly<ThemeOverrides> {
  return Object.freeze({ ...overrides });
}
