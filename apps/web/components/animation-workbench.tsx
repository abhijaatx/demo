"use client";

import {
  parseAndNormalizeMotionConfig,
  resolveEffectiveMotionConfig,
  type StepMotionConfig,
  type TransitionType
} from "@supademo/domain";
import { useMemo, useState } from "react";

type HotspotAnimation = "none" | "pulse" | "ping";
type ChapterAnimation = "none" | "fade" | "slide";

type AnimationStep = {
  readonly id: string;
  readonly title: string;
  readonly eyebrow: string;
  readonly accent: string;
  readonly hotspotLabel: string;
  readonly motion: StepMotionConfig;
};

const TRANSITIONS: readonly TransitionType[] = ["none", "fade", "slide", "zoom"];
const HOTSPOT_ANIMATIONS: readonly HotspotAnimation[] = ["none", "pulse", "ping"];
const CHAPTER_ANIMATIONS: readonly ChapterAnimation[] = ["none", "fade", "slide"];

const SAMPLE_STEPS: readonly AnimationStep[] = [
  {
    id: "motion-1",
    title: "Introduce the workspace",
    eyebrow: "Step 1 · Overview",
    accent: "#635bff",
    hotspotLabel: "Start here",
    motion: parseAndNormalizeMotionConfig({
      focusX: 38,
      focusY: 34,
      zoomScale: 1.15,
      transitionType: "fade",
      durationMs: 420
    })
  },
  {
    id: "motion-2",
    title: "Highlight the report",
    eyebrow: "Step 2 · Analytics",
    accent: "#0ea5a4",
    hotspotLabel: "Open analytics",
    motion: parseAndNormalizeMotionConfig({
      focusX: 67,
      focusY: 56,
      zoomScale: 1.35,
      transitionType: "zoom",
      durationMs: 520
    })
  },
  {
    id: "motion-3",
    title: "Share the result",
    eyebrow: "Step 3 · Publish",
    accent: "#f97316",
    hotspotLabel: "Share demo",
    motion: parseAndNormalizeMotionConfig({
      focusX: 73,
      focusY: 28,
      zoomScale: 1.25,
      transitionType: "slide",
      durationMs: 360
    })
  }
];

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function downloadPlan(value: unknown, fileName: string): void {
  const payload = JSON.stringify(value, null, 2);
  const blob = new Blob([payload], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AnimationWorkbench() {
  const [selectedId, setSelectedId] = useState(SAMPLE_STEPS[0]!.id);
  const [steps, setSteps] = useState<readonly AnimationStep[]>(SAMPLE_STEPS);
  const [hotspotAnimation, setHotspotAnimation] = useState<HotspotAnimation>("pulse");
  const [chapterAnimation, setChapterAnimation] = useState<ChapterAnimation>("fade");
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [message, setMessage] = useState(
    "Choose a step, then tune its zoom focus and transition before previewing."
  );

  const selectedStep = steps.find((step) => step.id === selectedId) ?? steps[0]!;
  const effectiveMotion = useMemo(
    () => resolveEffectiveMotionConfig(selectedStep.motion, prefersReducedMotion),
    [prefersReducedMotion, selectedStep.motion]
  );

  const updateMotion = (patch: Partial<StepMotionConfig>) => {
    const nextMotion = parseAndNormalizeMotionConfig({ ...selectedStep.motion, ...patch });
    setSteps((current) =>
      current.map((step) => (step.id === selectedStep.id ? { ...step, motion: nextMotion } : step))
    );
    setMessage("Motion settings saved locally for this step.");
  };

  const preview = () => {
    setPreviewing(true);
    setMessage(
      `Previewing ${selectedStep.title} with ${effectiveMotion.zoomScale.toFixed(2)}× zoom and ${effectiveMotion.transitionType} transition.`
    );
    window.setTimeout(() => setPreviewing(false), Math.max(300, effectiveMotion.durationMs));
  };

  const plan = {
    schemaVersion: 1,
    source: "browser-local-animation-workbench",
    reducedMotion: prefersReducedMotion,
    hotspotAnimation,
    chapterAnimation,
    steps: steps.map((step) => ({ id: step.id, title: step.title, motion: step.motion }))
  };

  return (
    <main className="motion-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/demos">
          ← Back to demos
        </a>
        <span className="motion-workbench-kicker">Animation</span>
        <h1>Zoom, pan &amp; motion effects</h1>
        <p>
          Recreate Supademo&apos;s animation pass: focus a zoom on a hotspot, choose a transition,
          and preview the exact motion a viewer will see.
        </p>
      </header>

      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <button
          type="button"
          className="motion-workbench-button motion-workbench-button-secondary"
          onClick={() => downloadPlan(plan, "supademo-animation-plan.json")}
        >
          Download plan
        </button>
      </div>

      <section className="motion-workbench-grid" aria-label="Animation editor">
        <aside className="motion-workbench-panel motion-workbench-steps">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Storyboard</span>
              <h2>Choose a step</h2>
            </div>
            <span className="motion-workbench-count">{steps.length} steps</span>
          </div>
          <div className="motion-workbench-step-list" role="listbox" aria-label="Animation steps">
            {steps.map((step, index) => (
              <button
                type="button"
                role="option"
                aria-selected={step.id === selectedStep.id}
                className={`motion-workbench-step${step.id === selectedStep.id ? " is-selected" : ""}`}
                key={step.id}
                onClick={() => {
                  setSelectedId(step.id);
                  setMessage(`${step.title} selected.`);
                }}
              >
                <span className="motion-workbench-step-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>
                  <strong>{step.title}</strong>
                  <small>{step.eyebrow}</small>
                </span>
                <span
                  className="motion-workbench-step-dot"
                  style={{ backgroundColor: step.accent }}
                />
              </button>
            ))}
          </div>
          <label className="motion-workbench-toggle">
            <input
              type="checkbox"
              checked={prefersReducedMotion}
              onChange={(event) => {
                setPrefersReducedMotion(event.currentTarget.checked);
                setMessage(
                  event.currentTarget.checked
                    ? "Reduced-motion preview enabled; zoom and transitions are disabled."
                    : "Full-motion preview restored."
                );
              }}
            />
            <span>Respect reduced motion</span>
          </label>
        </aside>

        <section className="motion-workbench-panel motion-workbench-preview-panel">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Live preview</span>
              <h2>{selectedStep.title}</h2>
            </div>
            <button
              type="button"
              className="motion-workbench-button motion-workbench-button-primary"
              onClick={preview}
            >
              {previewing ? "Playing…" : "Preview"}
            </button>
          </div>
          <div
            className={`motion-workbench-stage motion-workbench-transition-${effectiveMotion.transitionType}${previewing ? " is-playing" : ""}`}
            style={{
              ["--motion-focus-x" as string]: `${effectiveMotion.focusX}%`,
              ["--motion-focus-y" as string]: `${effectiveMotion.focusY}%`,
              ["--motion-scale" as string]: String(effectiveMotion.zoomScale),
              ["--motion-accent" as string]: selectedStep.accent
            }}
          >
            <div className="motion-workbench-browser-frame">
              <div className="motion-workbench-browser-bar">
                <span />
                <span />
                <span />
                <small>app.supademo.com</small>
              </div>
              <div className="motion-workbench-browser-body">
                <div className="motion-workbench-browser-sidebar">
                  <b>supademo</b>
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
                <div className="motion-workbench-browser-content">
                  <div className="motion-workbench-stat-row">
                    <div />
                    <div />
                    <div />
                  </div>
                  <div className="motion-workbench-chart">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <button
                    type="button"
                    className={`motion-workbench-hotspot motion-workbench-hotspot-${hotspotAnimation}`}
                    onClick={() => setMessage(`${selectedStep.hotspotLabel} hotspot selected.`)}
                  >
                    <span />
                    {selectedStep.hotspotLabel}
                  </button>
                  <div className="motion-workbench-table">
                    <i />
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              </div>
            </div>
            <div className="motion-workbench-focus-frame" aria-hidden="true" />
          </div>
          <p className="motion-workbench-preview-note">
            Effective motion: {effectiveMotion.focusX.toFixed(0)}% ×{" "}
            {effectiveMotion.focusY.toFixed(0)}%, {effectiveMotion.zoomScale.toFixed(2)}×,{" "}
            {effectiveMotion.durationMs} ms.
          </p>
        </section>

        <aside className="motion-workbench-panel motion-workbench-inspector">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Inspector</span>
              <h2>Step animation</h2>
            </div>
          </div>
          <label className="motion-workbench-field">
            <span>
              Zoom scale <output>{effectiveMotion.zoomScale.toFixed(2)}×</output>
            </span>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={selectedStep.motion.zoomScale}
              onChange={(event) => updateMotion({ zoomScale: Number(event.currentTarget.value) })}
            />
          </label>
          <div className="motion-workbench-field-grid">
            <label className="motion-workbench-field">
              <span>
                Focus X <output>{effectiveMotion.focusX.toFixed(0)}%</output>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={selectedStep.motion.focusX}
                onChange={(event) =>
                  updateMotion({ focusX: clamp(Number(event.currentTarget.value), 0, 100) })
                }
              />
            </label>
            <label className="motion-workbench-field">
              <span>
                Focus Y <output>{effectiveMotion.focusY.toFixed(0)}%</output>
              </span>
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={selectedStep.motion.focusY}
                onChange={(event) =>
                  updateMotion({ focusY: clamp(Number(event.currentTarget.value), 0, 100) })
                }
              />
            </label>
          </div>
          <label className="motion-workbench-field">
            <span>Transition</span>
            <select
              value={selectedStep.motion.transitionType}
              onChange={(event) =>
                updateMotion({ transitionType: event.currentTarget.value as TransitionType })
              }
            >
              {TRANSITIONS.map((transition) => (
                <option key={transition} value={transition}>
                  {transition}
                </option>
              ))}
            </select>
          </label>
          <label className="motion-workbench-field">
            <span>
              Duration <output>{effectiveMotion.durationMs} ms</output>
            </span>
            <input
              type="range"
              min="0"
              max="2000"
              step="20"
              value={selectedStep.motion.durationMs}
              onChange={(event) => updateMotion({ durationMs: Number(event.currentTarget.value) })}
            />
          </label>
          <div className="motion-workbench-divider" />
          <label className="motion-workbench-field">
            <span>Hotspot hover effect</span>
            <select
              value={hotspotAnimation}
              onChange={(event) =>
                setHotspotAnimation(event.currentTarget.value as HotspotAnimation)
              }
            >
              {HOTSPOT_ANIMATIONS.map((animation) => (
                <option key={animation} value={animation}>
                  {animation}
                </option>
              ))}
            </select>
          </label>
          <label className="motion-workbench-field">
            <span>Chapter button animation</span>
            <select
              value={chapterAnimation}
              onChange={(event) =>
                setChapterAnimation(event.currentTarget.value as ChapterAnimation)
              }
            >
              {CHAPTER_ANIMATIONS.map((animation) => (
                <option key={animation} value={animation}>
                  {animation}
                </option>
              ))}
            </select>
          </label>
          <p className="motion-workbench-helper">
            Zoom values and transition duration are bounded to the same ranges used by the demo
            motion model. Downloaded plans contain settings only, never captured pixels.
          </p>
        </aside>
      </section>
    </main>
  );
}
