"use client";

import { useEffect, useMemo, useState } from "react";

type PlaybackStep = {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly durationSeconds: number;
  readonly delaySeconds: number;
};

const MAX_DURATION_SECONDS = 30;
const MAX_DELAY_SECONDS = 10;

const INITIAL_STEPS: readonly PlaybackStep[] = [
  {
    id: "play-1",
    title: "Welcome",
    detail: "Introduce the product",
    durationSeconds: 4,
    delaySeconds: 0.5
  },
  {
    id: "play-2",
    title: "Explore",
    detail: "Show the key workflow",
    durationSeconds: 6,
    delaySeconds: 1
  },
  {
    id: "play-3",
    title: "Convert",
    detail: "Close with the next step",
    durationSeconds: 5,
    delaySeconds: 0.75
  }
];

function clamp(value: number, minimum: number, maximum: number): number {
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, value));
}

function downloadPlan(value: unknown, fileName: string): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AutoplayWorkbench() {
  const [steps, setSteps] = useState<readonly PlaybackStep[]>(INITIAL_STEPS);
  const [autoplay, setAutoplay] = useState(true);
  const [loop, setLoop] = useState(true);
  const [timingMode, setTimingMode] = useState<"uniform" | "custom">("uniform");
  const [uniformDuration, setUniformDuration] = useState(5);
  const [uniformDelay, setUniformDelay] = useState(0.75);
  const [progressColor, setProgressColor] = useState("#635bff");
  const [playing, setPlaying] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [message, setMessage] = useState(
    "Set a uniform duration for a polished walkthrough, or customize each slide individually."
  );

  const effectiveSteps = useMemo(
    () =>
      steps.map((step) => ({
        ...step,
        durationSeconds: timingMode === "uniform" ? uniformDuration : step.durationSeconds,
        delaySeconds: timingMode === "uniform" ? uniformDelay : step.delaySeconds
      })),
    [steps, timingMode, uniformDelay, uniformDuration]
  );
  const totalSeconds = useMemo(
    () =>
      effectiveSteps.reduce((total, step) => total + step.durationSeconds + step.delaySeconds, 0),
    [effectiveSteps]
  );

  useEffect(() => {
    if (!playing) return;
    const current = effectiveSteps[previewIndex];
    if (!current) {
      setPlaying(false);
      return;
    }
    const timeout = window.setTimeout(
      () => {
        const nextIndex = previewIndex + 1;
        if (nextIndex < effectiveSteps.length) {
          setPreviewIndex(nextIndex);
          return;
        }
        if (loop) {
          setPreviewIndex(0);
          return;
        }
        setPlaying(false);
        setMessage("Preview finished. Enable Loop to keep the demo cycling.");
      },
      (current.durationSeconds + current.delaySeconds) * 1000
    );
    return () => window.clearTimeout(timeout);
  }, [effectiveSteps, loop, playing, previewIndex]);

  const updateStep = (id: string, patch: Partial<PlaybackStep>) => {
    setSteps((current) =>
      current.map((step) =>
        step.id === id
          ? {
              ...step,
              ...patch,
              durationSeconds: clamp(
                patch.durationSeconds ?? step.durationSeconds,
                1,
                MAX_DURATION_SECONDS
              ),
              delaySeconds: clamp(patch.delaySeconds ?? step.delaySeconds, 0, MAX_DELAY_SECONDS)
            }
          : step
      )
    );
    setMessage("Playback timing updated locally.");
  };

  const startPreview = () => {
    if (!autoplay) {
      setMessage("Turn on Autoplay before starting a playback preview.");
      return;
    }
    setPreviewIndex(0);
    setPlaying(true);
    setMessage("Playback preview started. Each slide uses the configured duration and delay.");
  };

  const plan = {
    schemaVersion: 1,
    source: "browser-local-autoplay-workbench",
    autoplay,
    loop,
    timingMode,
    uniformDurationSeconds: uniformDuration,
    uniformDelaySeconds: uniformDelay,
    progressColor,
    totalDurationSeconds: totalSeconds,
    steps: effectiveSteps
  };

  return (
    <main className="motion-workbench-page autoplay-workbench-page">
      <header className="motion-workbench-header">
        <a className="motion-workbench-back" href="/demos">
          ← Back to demos
        </a>
        <span className="motion-workbench-kicker">Animation</span>
        <h1>Autoplay &amp; loop</h1>
        <p>
          Choose how long every step stays on screen, add transition gaps, and decide whether the
          viewer should start automatically or keep looping.
        </p>
      </header>

      <div className="motion-workbench-feedback" role="status">
        <span>{message}</span>
        <button
          type="button"
          className="motion-workbench-button motion-workbench-button-secondary"
          onClick={() => downloadPlan(plan, "supademo-autoplay-plan.json")}
        >
          Download plan
        </button>
      </div>

      <section className="autoplay-workbench-layout" aria-label="Autoplay settings">
        <div className="motion-workbench-panel autoplay-workbench-preview-panel">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Playback preview</span>
              <h2>{effectiveSteps[previewIndex]?.title ?? "Demo preview"}</h2>
            </div>
            <button
              type="button"
              className="motion-workbench-button motion-workbench-button-primary"
              onClick={playing ? () => setPlaying(false) : startPreview}
            >
              {playing ? "Stop preview" : "Preview"}
            </button>
          </div>
          <div
            className="autoplay-workbench-stage"
            style={{ ["--autoplay-progress" as string]: progressColor }}
          >
            <div className="autoplay-workbench-stage-glow" />
            <span className="autoplay-workbench-stage-index">
              {String(previewIndex + 1).padStart(2, "0")} /{" "}
              {String(effectiveSteps.length).padStart(2, "0")}
            </span>
            <strong>{effectiveSteps[previewIndex]?.title}</strong>
            <p>{effectiveSteps[previewIndex]?.detail}</p>
            <div className="autoplay-workbench-progress" aria-label="Playback progress">
              {effectiveSteps.map((step, index) => (
                <span
                  key={step.id}
                  className={
                    index === previewIndex
                      ? "is-current"
                      : index < previewIndex
                        ? "is-complete"
                        : ""
                  }
                  style={{
                    width: `${Math.max(8, (step.durationSeconds / Math.max(1, totalSeconds)) * 100)}%`
                  }}
                />
              ))}
            </div>
            <small>
              {playing
                ? `Playing for ${effectiveSteps[previewIndex]?.durationSeconds}s`
                : "Preview is paused"}
            </small>
          </div>
          <div className="autoplay-workbench-summary">
            <span>
              <strong>{totalSeconds.toFixed(1)}s</strong> estimated duration
            </span>
            <span>
              <strong>{loop ? "On" : "Off"}</strong> loop
            </span>
            <span>
              <strong>{autoplay ? "On" : "Off"}</strong> autoplay
            </span>
          </div>
        </div>

        <aside className="motion-workbench-panel autoplay-workbench-settings">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Player settings</span>
              <h2>Playback behavior</h2>
            </div>
          </div>
          <label className="motion-workbench-toggle">
            <input
              type="checkbox"
              checked={autoplay}
              onChange={(event) => setAutoplay(event.currentTarget.checked)}
            />
            <span>
              <strong>Autoplay</strong>
              <small>Start when the viewer opens the demo.</small>
            </span>
          </label>
          <label className="motion-workbench-toggle">
            <input
              type="checkbox"
              checked={loop}
              onChange={(event) => setLoop(event.currentTarget.checked)}
            />
            <span>
              <strong>Loop demo</strong>
              <small>Return to the first step after the last one.</small>
            </span>
          </label>
          <div className="motion-workbench-divider" />
          <fieldset className="autoplay-workbench-fieldset">
            <legend>Timing</legend>
            <div className="motion-workbench-segmented" role="group" aria-label="Timing mode">
              <button
                type="button"
                aria-pressed={timingMode === "uniform"}
                onClick={() => setTimingMode("uniform")}
              >
                Uniform
              </button>
              <button
                type="button"
                aria-pressed={timingMode === "custom"}
                onClick={() => setTimingMode("custom")}
              >
                Custom per step
              </button>
            </div>
          </fieldset>
          {timingMode === "uniform" ? (
            <>
              <label className="motion-workbench-field">
                <span>
                  Duration per step <output>{uniformDuration}s</output>
                </span>
                <input
                  type="range"
                  min="1"
                  max={String(MAX_DURATION_SECONDS)}
                  step="0.5"
                  value={uniformDuration}
                  onChange={(event) =>
                    setUniformDuration(
                      clamp(Number(event.currentTarget.value), 1, MAX_DURATION_SECONDS)
                    )
                  }
                />
              </label>
              <label className="motion-workbench-field">
                <span>
                  Transition gap <output>{uniformDelay}s</output>
                </span>
                <input
                  type="range"
                  min="0"
                  max={String(MAX_DELAY_SECONDS)}
                  step="0.25"
                  value={uniformDelay}
                  onChange={(event) =>
                    setUniformDelay(clamp(Number(event.currentTarget.value), 0, MAX_DELAY_SECONDS))
                  }
                />
              </label>
            </>
          ) : null}
          <label className="motion-workbench-color-field">
            <span>Progress bar color</span>
            <input
              type="color"
              value={progressColor}
              onChange={(event) => setProgressColor(event.currentTarget.value)}
              aria-label="Progress bar color"
            />
            <code>{progressColor}</code>
          </label>
          <p className="motion-workbench-helper">
            AI voiceovers should finish before the next step. Set a longer duration or gap when
            narration needs more time.
          </p>
        </aside>
      </section>

      {timingMode === "custom" ? (
        <section className="motion-workbench-panel autoplay-workbench-step-timing">
          <div className="motion-workbench-panel-heading">
            <div>
              <span className="motion-workbench-label">Per-step timing</span>
              <h2>Custom durations</h2>
            </div>
          </div>
          <div className="autoplay-workbench-step-list">
            {steps.map((step, index) => (
              <div className="autoplay-workbench-step-row" key={step.id}>
                <span className="motion-workbench-step-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <strong>{step.title}</strong>
                  <small>{step.detail}</small>
                </div>
                <label className="motion-workbench-inline-field">
                  <span>Duration</span>
                  <input
                    type="number"
                    min="1"
                    max={MAX_DURATION_SECONDS}
                    step="0.5"
                    value={step.durationSeconds}
                    onChange={(event) =>
                      updateStep(step.id, { durationSeconds: Number(event.currentTarget.value) })
                    }
                  />
                  <small>s</small>
                </label>
                <label className="motion-workbench-inline-field">
                  <span>Gap</span>
                  <input
                    type="number"
                    min="0"
                    max={MAX_DELAY_SECONDS}
                    step="0.25"
                    value={step.delaySeconds}
                    onChange={(event) =>
                      updateStep(step.id, { delaySeconds: Number(event.currentTarget.value) })
                    }
                  />
                  <small>s</small>
                </label>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
