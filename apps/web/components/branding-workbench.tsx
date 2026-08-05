"use client";

import {
  parseAndSanitizeBrandingTheme,
  sanitizeHexColor,
  validateSafeUrl,
  type BrandingTheme
} from "@supademo/domain";
import { useEffect, useState, type CSSProperties } from "react";

type BrandingTab = "watermark" | "identity" | "share-button";

type WatermarkSettings = {
  readonly enabled: boolean;
  readonly text: string;
  readonly link: string;
  readonly logoUrl: string;
};

type ShareButtonSettings = {
  readonly enabled: boolean;
  readonly text: string;
  readonly link: string;
  readonly backgroundColor: string;
  readonly textColor: string;
};

const defaultTheme = parseAndSanitizeBrandingTheme({
  logoUrl: null,
  primaryColor: "#635bff",
  backgroundColor: "#ffffff",
  textColor: "#172033",
  borderRadiusPx: 10,
  fontFamily: "Inter",
  hidePlatformBranding: false
});

const defaultWatermark: WatermarkSettings = {
  enabled: true,
  text: "Made with Supademo",
  link: "https://supademo.com",
  logoUrl: ""
};

const defaultShareButton: ShareButtonSettings = {
  enabled: true,
  text: "Book a demo",
  link: "https://supademo.com/product-demo",
  backgroundColor: "#635bff",
  textColor: "#ffffff"
};

function safeExternalUrl(value: string): string {
  const safe = validateSafeUrl(value);
  return safe && /^https?:\/\//iu.test(safe) ? safe : "";
}

function acceptImageFile(
  file: File | undefined,
  setError: (message: string) => void,
  setUrl: (url: string) => void
): void {
  if (!file) return;
  if (!file.type.startsWith("image/") || file.size > 2_000_000) {
    setError("Choose an image file under 2 MB.");
    return;
  }
  setError("");
  setUrl(URL.createObjectURL(file));
}

function updateThemeValue<K extends keyof BrandingTheme>(
  theme: BrandingTheme,
  key: K,
  value: BrandingTheme[K]
): BrandingTheme {
  return parseAndSanitizeBrandingTheme({ ...theme, [key]: value });
}

export function BrandingWorkbench() {
  const [tab, setTab] = useState<BrandingTab>("watermark");
  const [theme, setTheme] = useState<BrandingTheme>(defaultTheme);
  const [watermark, setWatermark] = useState<WatermarkSettings>(defaultWatermark);
  const [shareButton, setShareButton] = useState<ShareButtonSettings>(defaultShareButton);
  const [faviconUrl, setFaviconUrl] = useState("");
  const [message, setMessage] = useState(
    "Customize how your workspace appears on every share page."
  );
  const [error, setError] = useState("");

  useEffect(
    () => () => {
      if (watermark.logoUrl.startsWith("blob:")) URL.revokeObjectURL(watermark.logoUrl);
      if (faviconUrl.startsWith("blob:")) URL.revokeObjectURL(faviconUrl);
    },
    [faviconUrl, watermark.logoUrl]
  );

  const previewStyle = {
    "--branding-primary": theme.primaryColor,
    "--branding-bg": theme.backgroundColor,
    "--branding-text": theme.textColor,
    "--branding-radius": `${theme.borderRadiusPx}px`
  } as CSSProperties;

  const save = (): void => {
    const watermarkLink = safeExternalUrl(watermark.link);
    const shareLink = safeExternalUrl(shareButton.link);
    if ((watermark.enabled && !watermarkLink) || (shareButton.enabled && !shareLink)) {
      setError("CTA and watermark links must be valid HTTPS or HTTP URLs.");
      setMessage("Changes were not saved until the links are corrected.");
      return;
    }
    setError("");
    setMessage("Branding changes saved to this local preview.");
  };

  const setThemeKey = <K extends keyof BrandingTheme>(key: K, value: BrandingTheme[K]): void => {
    setTheme((current) => updateThemeValue(current, key, value));
  };

  const previewWatermarkLink = safeExternalUrl(watermark.link);
  const previewShareLink = safeExternalUrl(shareButton.link);

  return (
    <main className="motion-workbench-page branding-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/settings/profile">
          ← Back to workspace settings
        </a>
        <span className="motion-workbench-kicker">Workspace settings · Branding</span>
        <h1>Make every shared demo feel like yours</h1>
        <p>
          Customize the watermark, logo, favicon, and share-page call to action that viewers see
          across your Supademo workspace.
        </p>
      </header>
      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <span className="branding-workbench-local-badge">Local preview</span>
      </div>
      {error ? (
        <p className="branding-workbench-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="branding-workbench-layout">
        <section className="motion-workbench-panel branding-workbench-settings">
          <div className="branding-workbench-tabs" role="tablist" aria-label="Branding settings">
            {(
              [
                ["watermark", "Watermark", "Published demo overlay"],
                ["identity", "Logo & favicon", "Workspace identity"],
                ["share-button", "Share page button", "Viewer call to action"]
              ] as const
            ).map(([value, label, description]) => (
              <button
                type="button"
                role="tab"
                aria-selected={tab === value}
                className={tab === value ? "is-active" : ""}
                key={value}
                onClick={() => setTab(value)}
              >
                <strong>{label}</strong>
                <small>{description}</small>
              </button>
            ))}
          </div>

          {tab === "watermark" ? (
            <div className="branding-workbench-form">
              <div className="branding-workbench-section-heading">
                <div>
                  <span className="motion-workbench-label">Watermark</span>
                  <h2>Guide viewers to the next step</h2>
                </div>
                <span className={`branding-workbench-state ${watermark.enabled ? "is-on" : ""}`}>
                  {watermark.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <label className="branding-workbench-toggle">
                <input
                  type="checkbox"
                  checked={watermark.enabled}
                  onChange={(event) =>
                    setWatermark((current) => ({
                      ...current,
                      enabled: event.currentTarget.checked
                    }))
                  }
                />
                <span>
                  <strong>Enable watermark</strong>
                  <small>Show a small overlay in the bottom-right corner of published demos.</small>
                </span>
              </label>
              <label className="motion-workbench-field">
                <span>Logo (optional)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    acceptImageFile(event.currentTarget.files?.[0], setError, (url) =>
                      setWatermark((current) => ({ ...current, logoUrl: url }))
                    )
                  }
                />
                <small>PNG, JPG, or SVG under 2 MB. The local preview uses an object URL.</small>
              </label>
              <label className="motion-workbench-field">
                <span>Watermark text</span>
                <input
                  value={watermark.text}
                  maxLength={120}
                  onChange={(event) =>
                    setWatermark((current) => ({ ...current, text: event.currentTarget.value }))
                  }
                />
              </label>
              <label className="motion-workbench-field">
                <span>Click-through link</span>
                <input
                  value={watermark.link}
                  maxLength={500}
                  onChange={(event) =>
                    setWatermark((current) => ({ ...current, link: event.currentTarget.value }))
                  }
                  placeholder="https://yourcompany.com"
                />
              </label>
              <p className="branding-workbench-note">
                Free workspaces keep the Supademo watermark. Paid workspace administrators can
                customize or remove it after upgrading.
              </p>
            </div>
          ) : null}

          {tab === "identity" ? (
            <div className="branding-workbench-form">
              <div className="branding-workbench-section-heading">
                <div>
                  <span className="motion-workbench-label">Workspace identity</span>
                  <h2>Logo and favicon</h2>
                </div>
              </div>
              <label className="motion-workbench-field">
                <span>Default logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    acceptImageFile(event.currentTarget.files?.[0], setError, (url) =>
                      setThemeKey("logoUrl", url)
                    )
                  }
                />
                <small>Used across content pages, chapter forms, and screenshot-based demos.</small>
              </label>
              <label className="motion-workbench-field">
                <span>Favicon</span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/x-icon"
                  onChange={(event) =>
                    acceptImageFile(event.currentTarget.files?.[0], setError, setFaviconUrl)
                  }
                />
                <small>Use a simple 32×32 or 64×64 square icon for browser tabs.</small>
              </label>
              <div className="branding-workbench-two-column">
                <label className="motion-workbench-color-field">
                  <span>Primary color</span>
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(event) => setThemeKey("primaryColor", event.currentTarget.value)}
                  />
                </label>
                <label className="motion-workbench-color-field">
                  <span>Share-page background</span>
                  <input
                    type="color"
                    value={theme.backgroundColor}
                    onChange={(event) => setThemeKey("backgroundColor", event.currentTarget.value)}
                  />
                </label>
              </div>
              <div className="branding-workbench-two-column">
                <label className="motion-workbench-color-field">
                  <span>Text color</span>
                  <input
                    type="color"
                    value={theme.textColor}
                    onChange={(event) => setThemeKey("textColor", event.currentTarget.value)}
                  />
                </label>
                <label className="motion-workbench-field">
                  <span>Font family</span>
                  <select
                    value={theme.fontFamily}
                    onChange={(event) => setThemeKey("fontFamily", event.currentTarget.value)}
                  >
                    <option value="Inter">Inter</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Outfit">Outfit</option>
                    <option value="system-ui">System UI</option>
                    <option value="sans-serif">Sans-serif</option>
                    <option value="serif">Serif</option>
                  </select>
                </label>
              </div>
              <label className="branding-workbench-toggle">
                <input
                  type="checkbox"
                  checked={theme.hidePlatformBranding}
                  onChange={(event) =>
                    setThemeKey("hidePlatformBranding", event.currentTarget.checked)
                  }
                />
                <span>
                  <strong>Hide Supademo branding</strong>
                  <small>Available to eligible paid workspace plans.</small>
                </span>
              </label>
              <label className="motion-workbench-field">
                <span>Corner radius: {theme.borderRadiusPx}px</span>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={theme.borderRadiusPx}
                  onChange={(event) =>
                    setThemeKey("borderRadiusPx", Number(event.currentTarget.value))
                  }
                />
              </label>
            </div>
          ) : null}

          {tab === "share-button" ? (
            <div className="branding-workbench-form">
              <div className="branding-workbench-section-heading">
                <div>
                  <span className="motion-workbench-label">Share Page Button</span>
                  <h2>Give viewers a clear CTA</h2>
                </div>
                <span className={`branding-workbench-state ${shareButton.enabled ? "is-on" : ""}`}>
                  {shareButton.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>
              <label className="branding-workbench-toggle">
                <input
                  type="checkbox"
                  checked={shareButton.enabled}
                  onChange={(event) =>
                    setShareButton((current) => ({
                      ...current,
                      enabled: event.currentTarget.checked
                    }))
                  }
                />
                <span>
                  <strong>Show share-page button</strong>
                  <small>
                    Place a branded call to action in the top-right of supported share pages.
                  </small>
                </span>
              </label>
              <label className="motion-workbench-field">
                <span>Button text</span>
                <input
                  value={shareButton.text}
                  maxLength={50}
                  onChange={(event) =>
                    setShareButton((current) => ({ ...current, text: event.currentTarget.value }))
                  }
                />
                <small>Up to 50 characters.</small>
              </label>
              <label className="motion-workbench-field">
                <span>Button link</span>
                <input
                  value={shareButton.link}
                  maxLength={500}
                  onChange={(event) =>
                    setShareButton((current) => ({ ...current, link: event.currentTarget.value }))
                  }
                />
              </label>
              <div className="branding-workbench-two-column">
                <label className="motion-workbench-color-field">
                  <span>Background color</span>
                  <input
                    type="color"
                    value={shareButton.backgroundColor}
                    onChange={(event) =>
                      setShareButton((current) => ({
                        ...current,
                        backgroundColor: sanitizeHexColor(
                          event.currentTarget.value,
                          current.backgroundColor
                        )
                      }))
                    }
                  />
                </label>
                <label className="motion-workbench-color-field">
                  <span>Text color</span>
                  <input
                    type="color"
                    value={shareButton.textColor}
                    onChange={(event) =>
                      setShareButton((current) => ({
                        ...current,
                        textColor: sanitizeHexColor(event.currentTarget.value, current.textColor)
                      }))
                    }
                  />
                </label>
              </div>
            </div>
          ) : null}

          <button
            type="button"
            className="motion-workbench-button motion-workbench-button-primary branding-workbench-save"
            onClick={save}
          >
            Save branding changes
          </button>
        </section>

        <aside
          className="motion-workbench-panel branding-workbench-preview-panel"
          aria-label="Branding preview"
        >
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Preview</span>
              <h2>Published share page</h2>
            </div>
            {faviconUrl ? (
              <img className="branding-workbench-favicon" src={faviconUrl} alt="Favicon preview" />
            ) : (
              <span className="branding-workbench-favicon-fallback">S</span>
            )}
          </div>
          <div className="branding-workbench-browser-preview" style={previewStyle}>
            <div className="branding-workbench-browser-bar">
              <span />
              <span />
              <span />
              <small>app.supademo.com/e/customer-onboarding</small>
            </div>
            <div className="branding-workbench-page-preview">
              <div className="branding-workbench-page-brand">
                {theme.logoUrl ? (
                  <img src={theme.logoUrl} alt="Workspace logo preview" />
                ) : (
                  <span>S</span>
                )}
              </div>
              <span className="branding-workbench-preview-kicker">Customer onboarding</span>
              <h3>Show your product in minutes</h3>
              <p>Every logo, color, and CTA can be previewed before publishing.</p>
              {shareButton.enabled && previewShareLink ? (
                <a
                  className="branding-workbench-cta"
                  href={previewShareLink}
                  target="_blank"
                  rel="noreferrer"
                  style={{ background: shareButton.backgroundColor, color: shareButton.textColor }}
                >
                  {shareButton.text || "Learn more"}
                </a>
              ) : null}
              <div className="branding-workbench-preview-step" />
              <div className="branding-workbench-preview-step short" />
              {watermark.enabled && previewWatermarkLink ? (
                <a
                  className="branding-workbench-watermark"
                  href={previewWatermarkLink}
                  target="_blank"
                  rel="noreferrer"
                >
                  {watermark.logoUrl ? <img src={watermark.logoUrl} alt="" /> : <span>S</span>}
                  {watermark.text || "Made with Supademo"}
                </a>
              ) : null}
            </div>
          </div>
          <p className="branding-workbench-preview-note">
            Changes shown here are local. Production branding applies workspace-wide after an
            authorized save and publish.
          </p>
        </aside>
      </div>
      <p className="branding-workbench-disclaimer">
        Local preview only: production uploads require server-side type/signature validation,
        malware scanning, storage isolation, workspace permissions, and audit logging.
      </p>
    </main>
  );
}
