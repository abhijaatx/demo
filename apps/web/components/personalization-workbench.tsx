"use client";

import {
  DEFAULT_DEMO_PERSONALIZATION,
  extractPersonalizedVariablesFromUrl,
  generatePersonalizedEmbedUrl,
  parseDemoPersonalization,
  resolveTemplateTokens,
  type DemoPersonalization
} from "@supademo/domain";
import { useMemo, useState } from "react";

const MAX_TEMPLATE_LENGTH = 800;
const MAX_QUERY_LENGTH = 1_200;
const BASE_DEMO_URL = "http://localhost:3000/e/demo-preview";

function downloadPlan(value: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function PersonalizationWorkbench() {
  const [config, setConfig] = useState<DemoPersonalization>(DEFAULT_DEMO_PERSONALIZATION);
  const [allowlistDraft, setAllowlistDraft] = useState(config.allowlist.join(", "));
  const [template, setTemplate] = useState(
    "Hi {{name}}, welcome to the {{company}} {{role}} walkthrough."
  );
  const [queryString, setQueryString] = useState(
    "?v_name=Maya%20Patel&v_company=Northstar&v_role=Product%20leader"
  );
  const [shareLink, setShareLink] = useState("");
  const [message, setMessage] = useState(
    "Tokens are allowlisted and rendered as text; values never become HTML."
  );
  const [error, setError] = useState("");

  const queryVariables = useMemo(
    () =>
      extractPersonalizedVariablesFromUrl(queryString.slice(0, MAX_QUERY_LENGTH), config.allowlist),
    [config.allowlist, queryString]
  );
  const preview = useMemo(
    () => resolveTemplateTokens(template, queryVariables, config.fallbacks),
    [config.fallbacks, queryVariables, template]
  );

  const applyAllowlist = () => {
    const allowlist = allowlistDraft
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 12);
    const next = parseDemoPersonalization({ ...config, allowlist });
    setConfig(next);
    setAllowlistDraft(next.allowlist.join(", "));
    setMessage(
      `Allowlisted ${String(next.allowlist.length)} variables. Existing values were normalized.`
    );
    setError("");
  };

  const updateFallback = (name: string, value: string) => {
    setConfig((current) =>
      parseDemoPersonalization({
        ...current,
        fallbacks: { ...current.fallbacks, [name]: value.slice(0, 160) }
      })
    );
  };

  const createLink = () => {
    if (!config.enabled) {
      setError("Enable dynamic variables before creating a personalized link.");
      return;
    }
    const link = generatePersonalizedEmbedUrl(BASE_DEMO_URL, queryVariables, config.allowlist);
    setShareLink(link);
    setMessage("Personalized link created with only allowlisted v_* parameters.");
    setError("");
  };

  const plan = {
    schemaVersion: 1,
    source: "browser-local-personalization-workbench",
    config,
    template,
    queryVariables,
    preview,
    shareLink
  };

  return (
    <main className="motion-workbench-page personalization-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/demos">
          ← Back to demos
        </a>
        <span className="motion-workbench-kicker">Personalize</span>
        <h1>Make every demo feel made for the viewer</h1>
        <p>
          Use allowlisted tokens such as <code>{"{{name}}"}</code> and <code>{"{{company}}"}</code>,
          then generate a share link with bounded <code>v_*</code> parameters.
        </p>
      </header>

      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <button
          type="button"
          className="motion-workbench-button motion-workbench-button-secondary"
          onClick={() => downloadPlan(plan, "supademo-personalization-plan.json")}
        >
          Download plan
        </button>
      </div>
      {error ? (
        <p className="personalization-workbench-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="personalization-workbench-layout" aria-label="Personalization editor">
        <section className="motion-workbench-panel personalization-workbench-editor">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Authoring</span>
              <h2>Template content</h2>
            </div>
            <span className="motion-workbench-count">{config.allowlist.length}/12</span>
          </div>
          <label className="motion-workbench-toggle">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(event) =>
                setConfig((current) =>
                  parseDemoPersonalization({ ...current, enabled: event.currentTarget.checked })
                )
              }
            />
            <span>
              <strong>Enable dynamic variables</strong>
              <small>Values are resolved only for allowlisted keys.</small>
            </span>
          </label>
          <label className="motion-workbench-field">
            <span>Allowlisted variable names</span>
            <input
              value={allowlistDraft}
              maxLength={400}
              placeholder="name, company, role"
              onChange={(event) => setAllowlistDraft(event.currentTarget.value.slice(0, 400))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  applyAllowlist();
                }
              }}
            />
            <small className="personalization-workbench-field-note">
              Press Enter to normalize the list.
            </small>
          </label>
          <label className="motion-workbench-field">
            <span>
              Demo copy <output>{template.length}/800</output>
            </span>
            <textarea
              rows={7}
              maxLength={MAX_TEMPLATE_LENGTH}
              value={template}
              onChange={(event) =>
                setTemplate(event.currentTarget.value.slice(0, MAX_TEMPLATE_LENGTH))
              }
            />
          </label>
          <div className="personalization-workbench-fallbacks">
            <span className="motion-workbench-label">Fallback text</span>
            {config.allowlist.map((name) => (
              <label className="motion-workbench-field" key={name}>
                <span>{`{{${name}}}`}</span>
                <input
                  maxLength={160}
                  value={config.fallbacks[name] ?? ""}
                  placeholder="Shown when the link has no value"
                  onChange={(event) => updateFallback(name, event.currentTarget.value)}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="motion-workbench-panel personalization-workbench-preview">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Viewer preview</span>
              <h2>Resolved copy</h2>
            </div>
            <span className="personalization-workbench-safe-badge">Text-safe</span>
          </div>
          <div className="personalization-workbench-preview-card">
            <span className="personalization-workbench-preview-eyebrow">Personalized Supademo</span>
            <strong>{preview}</strong>
            <small>{Object.keys(queryVariables).length} URL values matched the allowlist.</small>
          </div>
          <label className="motion-workbench-field">
            <span>
              Viewer URL parameters{" "}
              <output>
                {queryString.length}/{MAX_QUERY_LENGTH}
              </output>
            </span>
            <input
              maxLength={MAX_QUERY_LENGTH}
              value={queryString}
              placeholder="?v_name=Maya&v_company=Northstar"
              onChange={(event) =>
                setQueryString(event.currentTarget.value.slice(0, MAX_QUERY_LENGTH))
              }
            />
          </label>
          <div className="personalization-workbench-variables" aria-label="Resolved variables">
            {config.allowlist.map((name) => (
              <div key={name}>
                <code>{`v_${name}`}</code>
                <span>{queryVariables[name] || config.fallbacks[name] || "Not provided"}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="motion-workbench-button motion-workbench-button-primary personalization-workbench-create"
            onClick={createLink}
          >
            Create personalized link
          </button>
          {shareLink ? (
            <p className="personalization-workbench-link" role="status">
              <span>Created link</span>
              <code>{shareLink}</code>
            </p>
          ) : null}
        </section>
      </section>
      <p className="personalization-workbench-disclaimer">
        Only names on the allowlist are accepted. Values are length-bounded and resolved as React
        text, not inserted into an HTML sink.
      </p>
    </main>
  );
}
