"use client";

import { useMemo, useState } from "react";

const MAX_PROMPT_LENGTH = 1_200;
const MAX_DEMOS = 10;

type DemoDraft = {
  readonly id: string;
  readonly name: string;
  readonly steps: number;
  readonly hotspotColor: string;
  readonly zoomApplied: boolean;
  readonly previousLabel: string;
  readonly nextLabel: string;
};

type Proposal = {
  readonly id: string;
  readonly prompt: string;
  readonly summary: string;
  readonly changes: readonly string[];
  readonly patch: ProposalPatch;
};

type ProposalPatch = {
  zoomApplied?: boolean;
  hotspotColor?: string;
  previousLabel?: string;
  nextLabel?: string;
};

const INITIAL_DEMOS: readonly DemoDraft[] = [
  {
    id: "demo-1",
    name: "Product walkthrough",
    steps: 8,
    hotspotColor: "#635bff",
    zoomApplied: false,
    previousLabel: "Back",
    nextLabel: "Next"
  },
  {
    id: "demo-2",
    name: "Customer onboarding",
    steps: 5,
    hotspotColor: "#635bff",
    zoomApplied: false,
    previousLabel: "Back",
    nextLabel: "Next"
  },
  {
    id: "demo-3",
    name: "Analytics overview",
    steps: 11,
    hotspotColor: "#0ea5a4",
    zoomApplied: true,
    previousLabel: "Previous",
    nextLabel: "Continue"
  }
];

function makeId(prefix: string): string {
  if (typeof globalThis.crypto?.randomUUID === "function")
    return `${prefix}-${globalThis.crypto.randomUUID()}`;
  return `${prefix}-${Date.now().toString(36)}`;
}

function parseColor(prompt: string): string | null {
  const match = prompt.match(/#([0-9a-f]{3,8})\b/i);
  if (!match) return null;
  const value = `#${match[1]}`.toLowerCase();
  return /^#[0-9a-f]{3}(?:[0-9a-f]{3}|[0-9a-f]{2})?$/u.test(value) ? value : null;
}

function buildProposal(prompt: string): Proposal {
  const normalized = prompt.trim().toLowerCase();
  const changes: string[] = [];
  const patch: ProposalPatch = {};
  if (normalized.includes("zoom")) {
    changes.push("Apply a guided zoom to every step in the selected demos.");
    patch.zoomApplied = true;
  }
  const color = parseColor(prompt);
  if (normalized.includes("hotspot") && color) {
    changes.push(`Set all hotspots to ${color}.`);
    patch.hotspotColor = color;
  } else if (
    normalized.includes("hotspot") &&
    (normalized.includes("black") || normalized.includes("dark"))
  ) {
    changes.push("Set all hotspots to #000000.");
    patch.hotspotColor = "#000000";
  }
  if (
    normalized.includes("previous") ||
    normalized.includes("next") ||
    normalized.includes("navigation") ||
    normalized.includes("label")
  ) {
    changes.push("Update navigation labels to Previous and Next.");
    patch.previousLabel = "Previous";
    patch.nextLabel = "Next";
  }
  if (!changes.length) {
    changes.push(
      "No supported local edit was detected. Try zoom, hotspot color, or navigation labels."
    );
  }
  return {
    id: makeId("proposal"),
    prompt: prompt.trim().slice(0, MAX_PROMPT_LENGTH),
    summary:
      changes.length === 1 && changes[0]!.startsWith("No supported")
        ? "Needs clarification"
        : `${String(changes.length)} reviewable change${changes.length === 1 ? "" : "s"} proposed`,
    changes,
    patch
  };
}

export function AiCommandWorkbench() {
  const [demos, setDemos] = useState<readonly DemoDraft[]>(INITIAL_DEMOS);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([INITIAL_DEMOS[0]!.id]);
  const [prompt, setPrompt] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [history, setHistory] = useState<readonly Proposal[]>([]);
  const [message, setMessage] = useState(
    "Describe a bulk edit in plain English. Nothing is changed until you approve the proposal."
  );
  const [error, setError] = useState("");

  const selectedDemos = useMemo(
    () => demos.filter((demo) => selectedIds.includes(demo.id)),
    [demos, selectedIds]
  );

  const toggleDemo = (id: string) => {
    setSelectedIds((current) => {
      if (current.includes(id)) return current.filter((value) => value !== id);
      if (current.length >= MAX_DEMOS) return current;
      return [...current, id];
    });
    setProposal(null);
    setError("");
  };

  const sendCommand = () => {
    const boundedPrompt = prompt.trim().slice(0, MAX_PROMPT_LENGTH);
    if (!boundedPrompt) {
      setError("Write a command before sending it.");
      return;
    }
    if (!selectedDemos.length) {
      setError("Select at least one demo before sending a bulk command.");
      return;
    }
    const nextProposal = buildProposal(boundedPrompt);
    setProposal(nextProposal);
    setMessage(
      `Proposal ready for ${String(selectedDemos.length)} selected demo${selectedDemos.length === 1 ? "" : "s"}. Review it before applying.`
    );
    setError("");
  };

  const approveProposal = () => {
    if (!proposal) return;
    const selected = new Set(selectedIds);
    setDemos((current) =>
      current.map((demo) => {
        if (!selected.has(demo.id)) return demo;
        return { ...demo, ...proposal.patch };
      })
    );
    setHistory((current) => [proposal, ...current].slice(0, 12));
    setMessage(
      `Applied ${String(proposal.changes.length)} approved change${proposal.changes.length === 1 ? "" : "s"} to ${String(selectedDemos.length)} demo${selectedDemos.length === 1 ? "" : "s"}.`
    );
    setProposal(null);
    setPrompt("");
  };

  return (
    <main className="motion-workbench-page ai-command-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/demos">
          ← Back to demos
        </a>
        <span className="motion-workbench-kicker">AI Command · Beta</span>
        <h1>Edit one demo or your whole library with plain English</h1>
        <p>
          Describe a batch of changes, inspect the proposed patch, then approve it. This local
          preview never sends prompts or demo content to a model.
        </p>
      </header>

      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <span className="ai-command-workbench-local-badge">Browser-local preview</span>
      </div>
      {error ? (
        <p className="ai-command-workbench-error" role="alert">
          {error}
        </p>
      ) : null}

      <section className="ai-command-workbench-layout" aria-label="AI Command editor">
        <aside className="motion-workbench-panel ai-command-workbench-library">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Target demos</span>
              <h2>Choose scope</h2>
            </div>
            <span className="motion-workbench-count">
              {selectedIds.length}/{MAX_DEMOS}
            </span>
          </div>
          <div className="ai-command-workbench-demo-list" role="group" aria-label="Demos to edit">
            {demos.map((demo) => (
              <label
                className={`ai-command-workbench-demo${selectedIds.includes(demo.id) ? " is-selected" : ""}`}
                key={demo.id}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(demo.id)}
                  onChange={() => toggleDemo(demo.id)}
                />
                <span>
                  <strong>{demo.name}</strong>
                  <small>
                    {demo.steps} steps · {demo.zoomApplied ? "zoom on" : "zoom off"}
                  </small>
                </span>
                <i style={{ backgroundColor: demo.hotspotColor }} />
              </label>
            ))}
          </div>
          <p className="motion-workbench-helper">
            AI Command can target one demo from the editor or multiple demos from this library view.
          </p>
        </aside>

        <section className="motion-workbench-panel ai-command-workbench-command">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Command</span>
              <h2>What should change?</h2>
            </div>
            <span className="ai-command-workbench-shortcut">⌘ Enter</span>
          </div>
          <label className="motion-workbench-field">
            <span>
              Message{" "}
              <output>
                {prompt.length}/{MAX_PROMPT_LENGTH}
              </output>
            </span>
            <textarea
              rows={7}
              maxLength={MAX_PROMPT_LENGTH}
              value={prompt}
              placeholder="Example: Add a zoom to every step, make hotspots black, and label the navigation buttons Previous and Next."
              onChange={(event) => setPrompt(event.currentTarget.value.slice(0, MAX_PROMPT_LENGTH))}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                  event.preventDefault();
                  sendCommand();
                }
              }}
            />
          </label>
          <div className="ai-command-workbench-suggestions" aria-label="Suggested commands">
            {[
              "Add a zoom to every step",
              "Make hotspots black (#000)",
              "Label navigation Previous and Next"
            ].map((suggestion) => (
              <button
                type="button"
                className="motion-workbench-button motion-workbench-button-secondary"
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="motion-workbench-button motion-workbench-button-primary ai-command-workbench-send"
            onClick={sendCommand}
          >
            Send command
          </button>
          {proposal ? (
            <div className="ai-command-workbench-proposal" aria-label="AI Command proposal">
              <div className="motion-workbench-panel-heading">
                <div>
                  <span className="motion-workbench-label">Review before applying</span>
                  <h3>{proposal.summary}</h3>
                </div>
                <span className="ai-command-workbench-proposal-badge">Approval required</span>
              </div>
              <p>Target: {selectedDemos.map((demo) => demo.name).join(", ")}</p>
              <ul>
                {proposal.changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
              <div className="ai-command-workbench-proposal-actions">
                <button
                  type="button"
                  className="motion-workbench-button motion-workbench-button-primary"
                  onClick={approveProposal}
                >
                  Approve changes
                </button>
                <button
                  type="button"
                  className="motion-workbench-button motion-workbench-button-secondary"
                  onClick={() => setProposal(null)}
                >
                  Discard
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="motion-workbench-panel ai-command-workbench-history">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Applied changes</span>
              <h2>Command history</h2>
            </div>
            <span className="motion-workbench-count">{history.length}</span>
          </div>
          {history.length ? (
            <div className="ai-command-workbench-history-list">
              {history.map((item) => (
                <article key={item.id}>
                  <strong>{item.summary}</strong>
                  <p>{item.prompt}</p>
                  <small>
                    {item.changes.length} approved change{item.changes.length === 1 ? "" : "s"}
                  </small>
                </article>
              ))}
            </div>
          ) : (
            <p className="motion-workbench-helper">
              Approved commands appear here with their original instruction and change count.
            </p>
          )}
        </aside>
      </section>
    </main>
  );
}
