"use client";

import {
  buildShareLinkUrl,
  calculateShareLinkExpiry,
  sanitizeShareLabel,
  SHARE_LINK_EXPIRY_OPTIONS,
  type ShareLinkExpiryPreset
} from "@supademo/domain";
import { useMemo, useState } from "react";

const MAX_ID_LENGTH = 96;
const MAX_LABEL_LENGTH = 64;
const MAX_PASSWORD_LENGTH = 120;

type AccessMode = "public" | "private" | "password" | "email";
type DisplayMode = "full" | "card";

const demoChoices = [
  { id: "demo-onboarding", title: "Customer onboarding" },
  { id: "demo-product", title: "Product walkthrough" },
  { id: "demo-analytics", title: "Analytics overview" }
] as const;

function createShareToken(): string {
  const uuid = globalThis.crypto?.randomUUID?.();
  if (!uuid) return "";
  return `sl_${uuid.replace(/[^a-zA-Z0-9_-]/gu, "").slice(0, 48)}`;
}

export function ShareLinksWorkbench() {
  const [demoId, setDemoId] = useState<string>(demoChoices[0]!.id);
  const [trackingLabel, setTrackingLabel] = useState("launch-email");
  const [startingStep, setStartingStep] = useState("0");
  const [accessMode, setAccessMode] = useState<AccessMode>("public");
  const [password, setPassword] = useState("");
  const [expiryPreset, setExpiryPreset] = useState<ShareLinkExpiryPreset>("none");
  const [displayMode, setDisplayMode] = useState<DisplayMode>("full");
  const [showDescriptions, setShowDescriptions] = useState(true);
  const [showcasePosition, setShowcasePosition] = useState("0");
  const [generatedLink, setGeneratedLink] = useState("");
  const [message, setMessage] = useState(
    "Choose access, tracking, and deep-link options before creating a share link."
  );
  const [error, setError] = useState("");

  const selectedDemo = demoChoices.find((demo) => demo.id === demoId) ?? demoChoices[0]!;
  const sanitizedLabel = sanitizeShareLabel(trackingLabel.slice(0, MAX_LABEL_LENGTH));
  const displayLabel = sanitizedLabel || "viewer-link";
  const baseUrl =
    typeof globalThis.location?.origin === "string"
      ? globalThis.location.origin
      : "http://localhost:3000";
  const baseShareUrl = `${baseUrl}/demos/${encodeURIComponent(demoId)}/view`;
  const expiryOptions = useMemo(() => SHARE_LINK_EXPIRY_OPTIONS, []);

  const createLink = (): void => {
    if (!demoId || demoId.length > MAX_ID_LENGTH) {
      setError("Choose a valid demo before creating a link.");
      return;
    }
    if (accessMode === "password" && password.trim().length < 8) {
      setError("Password-protected links require at least 8 characters in this preview.");
      return;
    }
    const expiry = calculateShareLinkExpiry(expiryPreset);
    const token = expiry ? createShareToken() : "";
    if (expiry && !token) {
      setError("Secure expiring-link generation is unavailable in this browser.");
      return;
    }
    const link = buildShareLinkUrl(baseShareUrl, {
      trackingLabel: displayLabel,
      step: startingStep === "0" ? null : Number(startingStep),
      token: token || null,
      expiresAtMs: expiry
    });
    const result = new URL(link);
    if (showcasePosition !== "0") result.searchParams.set("demo", showcasePosition);
    if (accessMode !== "public") result.searchParams.set("access", accessMode);
    setGeneratedLink(result.toString());
    setError("");
    setMessage(
      `${accessMode === "public" ? "Public" : accessMode === "email" ? "Email-gated" : accessMode === "password" ? "Password-protected" : "Private"} link created for ${selectedDemo.title}.`
    );
  };

  const copyLink = async (): Promise<void> => {
    if (!generatedLink) return;
    try {
      await navigator.clipboard?.writeText(generatedLink);
      setMessage("Share link copied. It contains no password or email value.");
    } catch {
      setMessage("Copy permission was unavailable; select the link and copy it manually.");
    }
  };

  const revokeLink = (): void => {
    setGeneratedLink("");
    setMessage("The local link draft was revoked. Production links must be revoked server-side.");
  };

  return (
    <main className="motion-workbench-page share-links-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/demos">
          ← Back to demos
        </a>
        <span className="motion-workbench-kicker">Share Link · Tracking and access</span>
        <h1>Share one demo with the right viewer</h1>
        <p>
          Create public, private, password-protected, email-gated, trackable, or expiring links.
          Deep-link to a step or a Supademo inside a showcase.
        </p>
      </header>
      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <span className="share-links-workbench-local-badge">Browser-local link preview</span>
      </div>
      {error ? (
        <p className="share-links-workbench-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="share-links-workbench-layout">
        <section
          className="motion-workbench-panel share-links-workbench-editor"
          aria-label="Share link settings"
        >
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Configure</span>
              <h2>Link settings</h2>
            </div>
            <span className="motion-workbench-count">{generatedLink ? "Ready" : "Draft"}</span>
          </div>
          <label className="motion-workbench-field">
            <span>Demo</span>
            <select
              value={demoId}
              onChange={(event) => {
                setDemoId(event.currentTarget.value);
                setGeneratedLink("");
              }}
            >
              {demoChoices.map((demo) => (
                <option value={demo.id} key={demo.id}>
                  {demo.title}
                </option>
              ))}
            </select>
          </label>
          <label className="motion-workbench-field">
            <span>Unique tracking label</span>
            <input
              type="text"
              maxLength={MAX_LABEL_LENGTH}
              value={trackingLabel}
              onChange={(event) => setTrackingLabel(event.currentTarget.value)}
              placeholder="e.g. launch-email"
            />
            <small>Allowed characters: letters, numbers, dots, underscores, and hyphens.</small>
          </label>
          <div className="share-links-workbench-two-column">
            <label className="motion-workbench-field">
              <span>Open at step</span>
              <select
                value={startingStep}
                onChange={(event) => setStartingStep(event.currentTarget.value)}
              >
                <option value="0">Start of demo</option>
                {[1, 2, 3, 4].map((step) => (
                  <option value={String(step)} key={step}>
                    Step {step}
                  </option>
                ))}
              </select>
            </label>
            <label className="motion-workbench-field">
              <span>Showcase demo</span>
              <select
                value={showcasePosition}
                onChange={(event) => setShowcasePosition(event.currentTarget.value)}
              >
                <option value="0">Standalone demo</option>
                <option value="1">First Supademo</option>
                <option value="2">Second Supademo</option>
                <option value="3">Third Supademo</option>
              </select>
            </label>
          </div>
          <fieldset className="share-links-workbench-fieldset">
            <legend>Who can view?</legend>
            {(["public", "private", "password", "email"] as const).map((mode) => (
              <label className="share-links-workbench-radio" key={mode}>
                <input
                  type="radio"
                  name="access-mode"
                  checked={accessMode === mode}
                  onChange={() => {
                    setAccessMode(mode);
                    setGeneratedLink("");
                  }}
                />
                <span>
                  <strong>
                    {mode === "public"
                      ? "Public"
                      : mode === "private"
                        ? "Private"
                        : mode === "password"
                          ? "Password protected"
                          : "Email gated"}
                  </strong>
                  <small>
                    {mode === "public"
                      ? "Anyone with the link can view."
                      : mode === "private"
                        ? "Only people with workspace access can view."
                        : mode === "password"
                          ? "Viewers must enter a password."
                          : "Viewers must submit a valid email."}
                  </small>
                </span>
              </label>
            ))}
          </fieldset>
          {accessMode === "password" ? (
            <label className="motion-workbench-field">
              <span>Viewer password</span>
              <input
                type="password"
                maxLength={MAX_PASSWORD_LENGTH}
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
                placeholder="At least 8 characters"
              />
              <small>The password is never placed in the URL.</small>
            </label>
          ) : null}
          <label className="motion-workbench-field">
            <span>Expiration</span>
            <select
              value={expiryPreset}
              onChange={(event) => {
                setExpiryPreset(event.currentTarget.value as ShareLinkExpiryPreset);
                setGeneratedLink("");
              }}
            >
              {expiryOptions.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <div className="share-links-workbench-two-column">
            <label className="share-links-workbench-check">
              <input
                type="checkbox"
                checked={displayMode === "full"}
                onChange={(event) => setDisplayMode(event.currentTarget.checked ? "full" : "card")}
              />
              <span>Full-screen viewer</span>
            </label>
            <label className="share-links-workbench-check">
              <input
                type="checkbox"
                checked={showDescriptions}
                onChange={(event) => setShowDescriptions(event.currentTarget.checked)}
              />
              <span>Show step descriptions</span>
            </label>
          </div>
          <button
            type="button"
            className="motion-workbench-button motion-workbench-button-primary share-links-workbench-create"
            onClick={createLink}
          >
            Create share link
          </button>
        </section>

        <section
          className="motion-workbench-panel share-links-workbench-preview"
          aria-label="Share link preview"
        >
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Viewer preview</span>
              <h2>{displayMode === "full" ? "Full-screen mode" : "Box card mode"}</h2>
            </div>
            <span className="share-links-workbench-preview-step">
              {startingStep === "0" ? "Step 1" : `Step ${startingStep}`}
            </span>
          </div>
          <div
            className={`share-links-workbench-demo-card ${displayMode === "full" ? "is-full" : "is-card"}`}
          >
            <div className="share-links-workbench-browser-bar">
              <i />
              <i />
              <i />
              <small>app.supademo.com/demo</small>
            </div>
            <div className="share-links-workbench-demo-body">
              <span className="share-links-workbench-demo-kicker">Interactive demo</span>
              <strong>{selectedDemo.title}</strong>
              <p>
                {showDescriptions
                  ? "Follow the highlighted steps to learn the workflow at your own pace."
                  : ""}
              </p>
              <div className="share-links-workbench-hotspot">Click to continue</div>
            </div>
          </div>
          {generatedLink ? (
            <div className="share-links-workbench-generated">
              <span>Generated link</span>
              <input readOnly aria-label="Generated share link" value={generatedLink} />
              <div>
                <button
                  type="button"
                  className="motion-workbench-button motion-workbench-button-primary"
                  onClick={() => void copyLink()}
                >
                  Copy link
                </button>
                <button type="button" className="motion-workbench-button" onClick={revokeLink}>
                  Revoke draft
                </button>
              </div>
            </div>
          ) : (
            <p className="share-links-workbench-empty">
              Create a link to see its tracking, step, access, and expiration parameters.
            </p>
          )}
          <div className="share-links-workbench-parameter-list">
            <span>
              <code>ref</code> {displayLabel}
            </span>
            <span>
              <code>step</code> {startingStep === "0" ? "not set" : startingStep}
            </span>
            <span>
              <code>access</code> {accessMode}
            </span>
            <span>
              <code>expires</code> {expiryPreset === "none" ? "never" : expiryPreset}
            </span>
          </div>
        </section>
      </div>
      <p className="share-links-workbench-disclaimer">
        This local preview generates bounded URLs only. Production public/private access, password
        hashing, email gates, revocation, and expiry enforcement must remain server-side.
      </p>
    </main>
  );
}
