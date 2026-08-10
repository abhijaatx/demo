"use client";

import { performAiDemoAudit, type DemoAuditScore } from "@supademo/domain";
import { useState } from "react";

const MAX_CONTEXT_LENGTH = 800;
const MAX_OUTCOME_LENGTH = 240;
const MAX_STEP_COUNT = 100;
const MAX_WORDS_PER_STEP = 500;

type AuditCategory = "overall" | "copy" | "flow" | "accessibility";

function scoreTone(score: number): string {
  if (score >= 90) return "Strong";
  if (score >= 75) return "On track";
  return "Needs attention";
}

export function AiAuditWorkbench() {
  const [context, setContext] = useState("");
  const [useCase, setUseCase] = useState("Marketing");
  const [outcome, setOutcome] = useState("");
  const [stepCount, setStepCount] = useState(5);
  const [wordsPerStep, setWordsPerStep] = useState(18);
  const [audit, setAudit] = useState<DemoAuditScore | null>(null);
  const [activeCategory, setActiveCategory] = useState<AuditCategory>("overall");
  const [previewing, setPreviewing] = useState(false);
  const [applied, setApplied] = useState<"current" | "duplicate" | null>(null);
  const [message, setMessage] = useState("Tell the audit what this demo should help viewers do.");
  const [error, setError] = useState("");

  const runAudit = () => {
    const boundedSteps = Math.min(MAX_STEP_COUNT, Math.max(1, Math.floor(stepCount)));
    const boundedWords = Math.min(MAX_WORDS_PER_STEP, Math.max(0, Math.floor(wordsPerStep)));
    if (!context.trim() || !outcome.trim()) {
      setError("Add demo context and a desired outcome before running the audit.");
      return;
    }
    const result = performAiDemoAudit(boundedSteps, boundedSteps * boundedWords);
    setAudit(result);
    setStepCount(boundedSteps);
    setWordsPerStep(boundedWords);
    setActiveCategory("overall");
    setPreviewing(false);
    setApplied(null);
    setError("");
    setMessage(
      "Audit complete. Review each score, preview the recommendations, then choose how to apply them."
    );
  };

  const previewChanges = () => {
    if (!audit) return;
    setPreviewing(true);
    setApplied(null);
    setMessage(
      "Preview mode is on. Recommendations are staged for review and have not changed your demo."
    );
  };

  const applyChanges = (target: "current" | "duplicate") => {
    if (!audit) return;
    setApplied(target);
    setPreviewing(false);
    setMessage(
      target === "current"
        ? "Recommendations applied to the current local audit draft. Review before publishing."
        : "A local variation was prepared with the recommendations. Review it before publishing."
    );
  };

  const categoryDetails: Record<
    AuditCategory,
    { label: string; score: number; description: string }
  > = audit
    ? {
        overall: {
          label: "Overall",
          score: audit.overallScore,
          description: "A balanced view of copy, flow, and accessibility."
        },
        copy: {
          label: "Copy",
          score: audit.copyScore,
          description: "How concise and scannable the step language is."
        },
        flow: {
          label: "Flow",
          score: audit.flowScore,
          description: "How focused the path is for a viewer with one goal."
        },
        accessibility: {
          label: "Accessibility",
          score: audit.accessibilityScore,
          description: "Baseline checks for an inclusive demo experience."
        }
      }
    : {
        overall: { label: "Overall", score: 0, description: "Run an audit to see the score." },
        copy: { label: "Copy", score: 0, description: "Run an audit to see the score." },
        flow: { label: "Flow", score: 0, description: "Run an audit to see the score." },
        accessibility: {
          label: "Accessibility",
          score: 0,
          description: "Run an audit to see the score."
        }
      };
  const selectedDetails = categoryDetails[activeCategory];

  return (
    <main className="ai-audit-page">
      <header className="ai-audit-header">
        <a className="ai-audit-back" href="/demos">
          ← Back to demos
        </a>
        <p className="eyebrow">Enhance with AI · AI Audit</p>
        <h1>Turn demo context into better conversion ideas</h1>
        <p>
          Run a deterministic local audit against Supademo’s core best-practice signals, inspect
          recommendations, and stage the changes before they touch a demo.
        </p>
      </header>

      <section className="ai-audit-input-card" aria-labelledby="ai-audit-input-heading">
        <div>
          <p className="eyebrow">1 · Set the goal</p>
          <h2 id="ai-audit-input-heading">Give the audit enough context</h2>
          <p>
            These bounded fields stay in this browser. No prompt or demo content is sent to an
            external provider.
          </p>
        </div>
        <div className="ai-audit-form">
          <label>
            Demo context
            <textarea
              rows={4}
              maxLength={MAX_CONTEXT_LENGTH}
              value={context}
              placeholder="What does this product or workflow help people do?"
              onChange={(event) => setContext(event.currentTarget.value)}
            />
          </label>
          <label>
            Primary use case
            <select value={useCase} onChange={(event) => setUseCase(event.currentTarget.value)}>
              <option>Marketing</option>
              <option>Sales</option>
              <option>Onboarding</option>
              <option>Support</option>
              <option>Internal enablement</option>
            </select>
          </label>
          <label>
            Desired outcome
            <input
              maxLength={MAX_OUTCOME_LENGTH}
              value={outcome}
              placeholder="What should a viewer do next?"
              onChange={(event) => setOutcome(event.currentTarget.value)}
            />
          </label>
          <div className="ai-audit-number-grid">
            <label>
              Number of steps
              <input
                type="number"
                min="1"
                max={MAX_STEP_COUNT}
                value={stepCount}
                onChange={(event) => setStepCount(Number(event.currentTarget.value))}
              />
            </label>
            <label>
              Average words / step
              <input
                type="number"
                min="0"
                max={MAX_WORDS_PER_STEP}
                value={wordsPerStep}
                onChange={(event) => setWordsPerStep(Number(event.currentTarget.value))}
              />
            </label>
          </div>
          <button type="button" className="ai-audit-primary" onClick={runAudit}>
            Run audit locally
          </button>
        </div>
      </section>

      <section className="ai-audit-results" aria-labelledby="ai-audit-results-heading">
        <div className="ai-audit-results-heading">
          <div>
            <p className="eyebrow">2 · Review insights</p>
            <h2 id="ai-audit-results-heading">
              {audit ? `Audit for ${useCase.toLowerCase()} demo` : "Your audit results"}
            </h2>
          </div>
          {audit ? <span className="ai-audit-badge">{scoreTone(audit.overallScore)}</span> : null}
        </div>
        {audit ? (
          <>
            <div className="ai-audit-score-grid">
              {(Object.keys(categoryDetails) as AuditCategory[]).map((category) => {
                const details = categoryDetails[category];
                return (
                  <button
                    type="button"
                    key={category}
                    className={activeCategory === category ? "is-selected" : ""}
                    onClick={() => setActiveCategory(category)}
                  >
                    <span>{details.label}</span>
                    <strong>{details.score}</strong>
                    <small>{scoreTone(details.score)}</small>
                  </button>
                );
              })}
            </div>
            <div className="ai-audit-detail" role="status">
              <strong>
                {selectedDetails.label} · {selectedDetails.score}/100
              </strong>
              <p>{selectedDetails.description}</p>
              <div className="ai-audit-meter">
                <span style={{ width: `${String(selectedDetails.score)}%` }} />
              </div>
            </div>
            <div className="ai-audit-recommendations">
              <h3>Recommendations</h3>
              {audit.recommendations.length ? (
                <ol>
                  {audit.recommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))}
                </ol>
              ) : (
                <p>
                  Your demo is already within the local baseline. Keep reviewing the viewer
                  experience as content changes.
                </p>
              )}
            </div>
            <div className="ai-audit-actions">
              <button type="button" className="ai-audit-primary" onClick={previewChanges}>
                Preview changes
              </button>
              {previewing ? (
                <>
                  <button type="button" onClick={() => applyChanges("current")}>
                    Apply to current demo
                  </button>
                  <button type="button" onClick={() => applyChanges("duplicate")}>
                    Duplicate demo and apply
                  </button>
                </>
              ) : null}
            </div>
            {applied ? (
              <p className="ai-audit-applied" role="status">
                {applied === "current"
                  ? "Applied to current demo."
                  : "Prepared a duplicate variation."}
              </p>
            ) : null}
          </>
        ) : (
          <p className="ai-audit-empty">Run an audit to see score cards and recommendations.</p>
        )}
      </section>

      {error ? (
        <p className="ai-audit-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="ai-audit-status" role="status" aria-live="polite">
        {message}
      </p>
      <aside className="ai-audit-note">
        Local audit mode is intentionally transparent and reviewable. Production AI suggestions must
        use the authenticated, quota-controlled AI gateway and remain untrusted until you approve
        them.
      </aside>
    </main>
  );
}
