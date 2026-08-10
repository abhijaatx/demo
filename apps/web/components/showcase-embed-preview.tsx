"use client";

import { useState } from "react";

const showcaseSteps = [
  ["Platform overview", "Interactive Demo"],
  ["Every 19 seconds", "Video"],
  ["Create custom routes", "Interactive Demo"],
  ["Training on Strava", "Interactive Demo"],
  ["Explore clubs and memberships", "Interactive Demo"],
  ["Set custom challenges", "Interactive Demo"],
  ["Creating segments", "Interactive Demo"],
  ["Your goals start here", "Video"]
] as const;

export function ShowcaseEmbedPreview() {
  const [activeStep, setActiveStep] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  const goToStep = (nextStep: number) => {
    setActiveStep(Math.max(0, Math.min(showcaseSteps.length - 1, nextStep)));
  };

  return (
    <div className={`showcase-embed-preview${isExpanded ? " is-expanded" : ""}`}>
      <div className="showcase-embed-sidebar" aria-label="Showcase steps">
        <div className="showcase-embed-brand-row">
          <strong>STRAVA</strong>
          <span aria-live="polite">
            × {activeStep + 1} / {showcaseSteps.length}
          </span>
        </div>
        <p>INTRODUCTION</p>
        {showcaseSteps.map(([title, kind], index) => (
          <button
            className={index === activeStep ? "is-active" : undefined}
            type="button"
            key={title}
            onClick={() => goToStep(index)}
            aria-pressed={index === activeStep}
          >
            <span aria-hidden="true">{kind === "Video" ? "▶" : "▣"}</span>
            <span>
              <b>{title}</b>
              <small>{kind}</small>
            </span>
          </button>
        ))}
      </div>
      <div className="showcase-embed-stage">
        <div className="showcase-embed-stage-bar">
          <span />
          <span />
          <span />
          <b>Strava App Tour</b>
          <button type="button" onClick={() => setIsExpanded((value) => !value)}>
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
        <img
          src="/showcase-embed-preview-v3.jpg"
          alt="Strava Mobile App Tour showcase preview"
          loading="eager"
        />
        <div className="showcase-embed-stage-copy">
          <h2>Strava Mobile App Tour</h2>
          <p>Let&apos;s explore the Strava App, step by step.</p>
          <div>
            <a href="/signup">See it live</a>
            <a href="/signup">Visit Site</a>
          </div>
        </div>
        <div className="showcase-embed-controls" aria-label="Playback controls">
          <button
            type="button"
            onClick={() => goToStep(activeStep - 1)}
            disabled={activeStep === 0}
          >
            Previous step
          </button>
          <button
            type="button"
            onClick={() => goToStep(activeStep + 1)}
            disabled={activeStep === showcaseSteps.length - 1}
          >
            Next step
          </button>
        </div>
      </div>
      <a className="showcase-embed-kudos" href="/signup">
        <span aria-hidden="true">S</span> Try Supademo
      </a>
    </div>
  );
}
