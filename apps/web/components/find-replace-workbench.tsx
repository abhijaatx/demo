"use client";

import { useMemo, useState } from "react";

const MAX_VALUE_LENGTH = 160;
const MAX_NODES = 40;

type Mode = "text" | "emails" | "dates" | "images";
type EmailScope = "all" | "selected" | "domain";
type DateMode = "rolling" | "custom";

type ContentNode = {
  readonly id: string;
  readonly page: number;
  readonly label: string;
  readonly text: string;
  readonly kind: "text" | "email" | "date";
};

const INITIAL_NODES: readonly ContentNode[] = [
  {
    id: "node-1",
    page: 1,
    label: "Hero heading",
    text: "Welcome to the Acme analytics workspace",
    kind: "text"
  },
  { id: "node-2", page: 1, label: "Owner email", text: "sarah.chen@acme.io", kind: "email" },
  {
    id: "node-3",
    page: 2,
    label: "Step description",
    text: "Review your weekly pipeline report",
    kind: "text"
  },
  { id: "node-4", page: 2, label: "Published date", text: "June 15, 2025", kind: "date" },
  { id: "node-5", page: 3, label: "Support email", text: "support@example.com", kind: "email" },
  { id: "node-6", page: 4, label: "Footer date", text: "07/30/2025", kind: "date" },
  {
    id: "node-7",
    page: 5,
    label: "CTA label",
    text: "Book a demo with the Acme team",
    kind: "text"
  }
];

function replaceText(
  value: string,
  find: string,
  replacement: string,
  caseSensitive: boolean,
  exactMatch: boolean
): string {
  if (!find) return value;
  if (exactMatch) {
    const matches = caseSensitive ? value === find : value.toLowerCase() === find.toLowerCase();
    return matches ? replacement : value;
  }
  const loweredValue = value.toLowerCase();
  const loweredFind = find.toLowerCase();
  let cursor = 0;
  let output = "";
  while (cursor < value.length) {
    const index = caseSensitive
      ? value.indexOf(find, cursor)
      : loweredValue.indexOf(loweredFind, cursor);
    if (index < 0) return output + value.slice(cursor);
    output += value.slice(cursor, index) + replacement;
    cursor = index + find.length;
  }
  return output;
}

function contains(
  value: string,
  find: string,
  caseSensitive: boolean,
  exactMatch: boolean
): boolean {
  if (!find) return false;
  return exactMatch
    ? caseSensitive
      ? value === find
      : value.toLowerCase() === find.toLowerCase()
    : caseSensitive
      ? value.includes(find)
      : value.toLowerCase().includes(find.toLowerCase());
}

function renderHighlight(value: string, find: string, caseSensitive: boolean) {
  if (!find) return value;
  const result: React.ReactNode[] = [];
  const lowerValue = value.toLowerCase();
  const lowerFind = find.toLowerCase();
  let cursor = 0;
  let key = 0;
  while (cursor < value.length) {
    const index = caseSensitive
      ? value.indexOf(find, cursor)
      : lowerValue.indexOf(lowerFind, cursor);
    if (index < 0) break;
    if (index > cursor) result.push(value.slice(cursor, index));
    result.push(<mark key={`match-${key++}`}>{value.slice(index, index + find.length)}</mark>);
    cursor = index + find.length;
  }
  if (cursor === 0) return value;
  if (cursor < value.length) result.push(value.slice(cursor));
  return result;
}

function fakeEmail(index: number): string {
  return `viewer-${String(index + 1).padStart(3, "0")}@example.test`;
}

function shiftedDate(value: string, days: number): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  parsed.setDate(parsed.getDate() + days);
  return parsed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function FindReplaceWorkbench() {
  const [mode, setMode] = useState<Mode>("text");
  const [nodes, setNodes] = useState<readonly ContentNode[]>(INITIAL_NODES);
  const [find, setFind] = useState("Acme");
  const [replacement, setReplacement] = useState("Supademo");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [exactMatch, setExactMatch] = useState(false);
  const [allPages, setAllPages] = useState(true);
  const [emailScope, setEmailScope] = useState<EmailScope>("all");
  const [emailDomain, setEmailDomain] = useState("acme.io");
  const [selectedEmailIds, setSelectedEmailIds] = useState<readonly string[]>(["node-2"]);
  const [dateMode, setDateMode] = useState<DateMode>("rolling");
  const [dateStart, setDateStart] = useState("2026-01-01");
  const [dateEnd, setDateEnd] = useState("2026-12-31");
  const [message, setMessage] = useState(
    "Find and replace changes only text nodes; formatting and links remain intact."
  );
  const [error, setError] = useState("");

  const boundedFind = find.slice(0, MAX_VALUE_LENGTH);
  const boundedReplacement = replacement.slice(0, MAX_VALUE_LENGTH);
  const textResults = useMemo(
    () =>
      nodes.filter(
        (node) =>
          node.kind === "text" &&
          (allPages || node.page === 1) &&
          contains(node.text, boundedFind, caseSensitive, exactMatch)
      ),
    [allPages, boundedFind, caseSensitive, exactMatch, nodes]
  );
  const emailNodes = useMemo(() => nodes.filter((node) => node.kind === "email"), [nodes]);
  const dateNodes = useMemo(() => nodes.filter((node) => node.kind === "date"), [nodes]);

  const applyText = (): void => {
    if (!boundedFind.trim()) {
      setError("Enter text to find before applying a replacement.");
      return;
    }
    if (!textResults.length) {
      setError("No matching text nodes were found on the selected pages.");
      return;
    }
    const matching = new Set(textResults.map((node) => node.id));
    setNodes((current) =>
      current.map((node) =>
        matching.has(node.id)
          ? {
              ...node,
              text: replaceText(
                node.text,
                boundedFind,
                boundedReplacement,
                caseSensitive,
                exactMatch
              )
            }
          : node
      )
    );
    setError("");
    setMessage(
      `Replaced text in ${String(textResults.length)} matching node${textResults.length === 1 ? "" : "s"}.`
    );
  };

  const applyEmails = (): void => {
    const selected = new Set(selectedEmailIds);
    const domain = emailDomain.trim().toLowerCase().replace(/^@/u, "").slice(0, MAX_VALUE_LENGTH);
    const targets = emailNodes.filter((node) => {
      if (emailScope === "selected") return selected.has(node.id);
      if (emailScope === "domain") return node.text.toLowerCase().endsWith(`@${domain}`);
      return true;
    });
    if (!targets.length) {
      setError("No email nodes match the selected anonymization scope.");
      return;
    }
    const targetIds = new Set(targets.map((node) => node.id));
    const order = new Map(emailNodes.map((node, index) => [node.id, index]));
    setNodes((current) =>
      current.map((node) =>
        targetIds.has(node.id) ? { ...node, text: fakeEmail(order.get(node.id) ?? 0) } : node
      )
    );
    setError("");
    setMessage(
      `Anonymized ${String(targets.length)} email${targets.length === 1 ? "" : "s"} with example.test addresses.`
    );
  };

  const applyDates = (): void => {
    setNodes((current) =>
      current.map((node) =>
        node.kind === "date"
          ? {
              ...node,
              text:
                dateMode === "rolling" ? shiftedDate(node.text, 365) : `${dateStart} → ${dateEnd}`
            }
          : node
      )
    );
    setError("");
    setMessage(
      dateMode === "rolling"
        ? "Updated dates with a rolling one-year example window."
        : "Updated dates to the selected custom range."
    );
  };

  const toggleEmail = (id: string): void =>
    setSelectedEmailIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );

  return (
    <main className="motion-workbench-page find-replace-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/demos">
          ← Back to demos
        </a>
        <span className="motion-workbench-kicker">Find &amp; Replace · Content maintenance</span>
        <h1>Keep every demo current in one pass</h1>
        <p>
          Find and replace common text across every slide, anonymize captured emails, and keep dates
          fresh without changing the surrounding design.
        </p>
      </header>
      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <span className="find-replace-workbench-local-badge">Browser-local content preview</span>
      </div>
      {error ? (
        <p className="find-replace-workbench-error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="find-replace-workbench-layout">
        <aside className="motion-workbench-panel find-replace-workbench-controls">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Maintenance tools</span>
              <h2>Choose an operation</h2>
            </div>
          </div>
          <div
            className="find-replace-workbench-tabs"
            role="tablist"
            aria-label="Find and replace modes"
          >
            {(["text", "emails", "dates", "images"] as const).map((item) => (
              <button
                type="button"
                role="tab"
                aria-selected={mode === item}
                className={mode === item ? "is-selected" : ""}
                onClick={() => {
                  setMode(item);
                  setError("");
                }}
                key={item}
              >
                {item === "text"
                  ? "Text"
                  : item === "emails"
                    ? "Emails"
                    : item === "dates"
                      ? "Dates"
                      : "Images"}
              </button>
            ))}
          </div>

          {mode === "text" ? (
            <div className="find-replace-workbench-form">
              <label className="motion-workbench-field">
                <span>Find</span>
                <input
                  type="text"
                  maxLength={MAX_VALUE_LENGTH}
                  value={find}
                  onChange={(event) => setFind(event.currentTarget.value)}
                  placeholder="Text to find"
                />
              </label>
              <label className="motion-workbench-field">
                <span>Replace with</span>
                <input
                  type="text"
                  maxLength={MAX_VALUE_LENGTH}
                  value={replacement}
                  onChange={(event) => setReplacement(event.currentTarget.value)}
                  placeholder="New text"
                />
              </label>
              <label className="find-replace-workbench-check">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(event) => setCaseSensitive(event.currentTarget.checked)}
                />
                <span>Case-sensitive</span>
              </label>
              <label className="find-replace-workbench-check">
                <input
                  type="checkbox"
                  checked={exactMatch}
                  onChange={(event) => setExactMatch(event.currentTarget.checked)}
                />
                <span>Exact match</span>
              </label>
              <label className="find-replace-workbench-check">
                <input
                  type="checkbox"
                  checked={allPages}
                  onChange={(event) => setAllPages(event.currentTarget.checked)}
                />
                <span>Search every page</span>
              </label>
              <button
                type="button"
                className="motion-workbench-button motion-workbench-button-primary find-replace-workbench-apply"
                onClick={applyText}
              >
                Replace {textResults.length ? `(${textResults.length})` : "all"}
              </button>
              <small>
                Only text nodes shared by the current editing page are changed. Formatting, links,
                and interactive elements stay untouched.
              </small>
            </div>
          ) : null}

          {mode === "emails" ? (
            <div className="find-replace-workbench-form">
              <fieldset>
                <legend>Anonymize emails</legend>
                {(["all", "selected", "domain"] as const).map((scope) => (
                  <label className="find-replace-workbench-check" key={scope}>
                    <input
                      type="radio"
                      name="email-scope"
                      checked={emailScope === scope}
                      onChange={() => setEmailScope(scope)}
                    />
                    <span>
                      {scope === "all"
                        ? "All emails"
                        : scope === "selected"
                          ? "Selected emails"
                          : "Specific domain"}
                    </span>
                  </label>
                ))}
              </fieldset>
              {emailScope === "domain" ? (
                <label className="motion-workbench-field">
                  <span>Domain</span>
                  <input
                    type="text"
                    maxLength={MAX_VALUE_LENGTH}
                    value={emailDomain}
                    onChange={(event) => setEmailDomain(event.currentTarget.value)}
                    placeholder="company.com"
                  />
                </label>
              ) : null}
              {emailScope === "selected" ? (
                <div className="find-replace-workbench-email-list">
                  {emailNodes.map((node) => (
                    <label className="find-replace-workbench-check" key={node.id}>
                      <input
                        type="checkbox"
                        checked={selectedEmailIds.includes(node.id)}
                        onChange={() => toggleEmail(node.id)}
                      />
                      <span>{node.text}</span>
                    </label>
                  ))}
                </div>
              ) : null}
              <button
                type="button"
                className="motion-workbench-button motion-workbench-button-primary find-replace-workbench-apply"
                onClick={applyEmails}
              >
                Anonymize emails
              </button>
              <small>
                Generated addresses use the reserved <code>example.test</code> domain and never send
                the captured value anywhere.
              </small>
            </div>
          ) : null}

          {mode === "dates" ? (
            <div className="find-replace-workbench-form">
              <fieldset>
                <legend>Update dates</legend>
                <label className="find-replace-workbench-check">
                  <input
                    type="radio"
                    name="date-mode"
                    checked={dateMode === "rolling"}
                    onChange={() => setDateMode("rolling")}
                  />
                  <span>Keep a rolling 60-day window</span>
                </label>
                <label className="find-replace-workbench-check">
                  <input
                    type="radio"
                    name="date-mode"
                    checked={dateMode === "custom"}
                    onChange={() => setDateMode("custom")}
                  />
                  <span>Use a custom range</span>
                </label>
              </fieldset>
              {dateMode === "custom" ? (
                <div className="find-replace-workbench-date-fields">
                  <label className="motion-workbench-field">
                    <span>Start</span>
                    <input
                      type="date"
                      value={dateStart}
                      onChange={(event) => setDateStart(event.currentTarget.value)}
                    />
                  </label>
                  <label className="motion-workbench-field">
                    <span>End</span>
                    <input
                      type="date"
                      value={dateEnd}
                      onChange={(event) => setDateEnd(event.currentTarget.value)}
                    />
                  </label>
                </div>
              ) : null}
              <button
                type="button"
                className="motion-workbench-button motion-workbench-button-primary find-replace-workbench-apply"
                onClick={applyDates}
              >
                Update dates
              </button>
              <small>
                Dates are highlighted before applying so reviewers can confirm the range.
              </small>
            </div>
          ) : null}

          {mode === "images" ? (
            <div className="find-replace-workbench-coming-soon">
              <span aria-hidden="true">◌</span>
              <strong>Image find &amp; replace is coming soon</strong>
              <p>
                Supademo currently supports text, email anonymization, and date maintenance here.
                Image replacement remains a separate editor action.
              </p>
            </div>
          ) : null}
        </aside>

        <section className="motion-workbench-panel find-replace-workbench-preview">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Review changes</span>
              <h2>
                {mode === "text"
                  ? `${textResults.length} matching text nodes`
                  : mode === "emails"
                    ? `${emailNodes.length} email nodes`
                    : mode === "dates"
                      ? `${dateNodes.length} date nodes`
                      : "Image replacement"}
              </h2>
            </div>
            <span className="motion-workbench-count">Max {MAX_NODES}</span>
          </div>
          <div className="find-replace-workbench-node-list">
            {nodes.map((node) => {
              const isMatch =
                mode === "text" && textResults.some((result) => result.id === node.id);
              const preview =
                mode === "text" && isMatch
                  ? replaceText(
                      node.text,
                      boundedFind,
                      boundedReplacement,
                      caseSensitive,
                      exactMatch
                    )
                  : mode === "emails" && node.kind === "email"
                    ? fakeEmail(emailNodes.findIndex((email) => email.id === node.id))
                    : mode === "dates" && node.kind === "date"
                      ? dateMode === "rolling"
                        ? shiftedDate(node.text, 365)
                        : `${dateStart} → ${dateEnd}`
                      : node.text;
              return (
                <article
                  className={`find-replace-workbench-node${isMatch || (mode === "emails" && node.kind === "email") || (mode === "dates" && node.kind === "date") ? " is-match" : ""}`}
                  key={node.id}
                >
                  <div>
                    <span className="find-replace-workbench-page-number">Page {node.page}</span>
                    <strong>{node.label}</strong>
                  </div>
                  <p>
                    {mode === "text" && isMatch
                      ? renderHighlight(node.text, boundedFind, caseSensitive)
                      : node.text}
                  </p>
                  {preview !== node.text ? (
                    <div className="find-replace-workbench-preview-value">
                      <span>Preview</span>
                      <strong>{preview}</strong>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
          <p className="find-replace-workbench-footnote">
            Preview data is illustrative and stays in this browser tab. Apply creates a new local
            revision in this workbench.
          </p>
        </section>
      </div>
    </main>
  );
}
