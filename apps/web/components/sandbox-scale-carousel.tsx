"use client";

import { useState } from "react";

const cards = [
  [
    "Record Interactive Demos",
    "Record demos in HTML, screenshot, video or in multi-demo formats.",
    "https://supademo.com/images/scale-01.avif",
    "Record Interactive Demos"
  ],
  [
    "Advanced Analytics",
    "Get deep insights into dropoff rates, conversion, engagement, and viewers.",
    "https://supademo.com/images/scale-02.avif",
    "Advanced Analytics"
  ],
  [
    "Team Workspaces",
    "Asynchronously share, organize, and collaborate on Supademos as a team.",
    "https://supademo.com/images/scale-03.avif",
    "Team Workspaces"
  ],
  [
    "Trigger as In-App Tour",
    "Programmatically trigger in-app tours to better onboard and guide your users.",
    "https://supademo.com/images/scale-04.avif",
    "Trigger as In-App Tour"
  ],
  [
    "Auto-Translation",
    "Translate your product demos instantly in 15+ languages with the power of AI.",
    "https://supademo.com/images/scale-05.avif",
    "Auto-Translation"
  ],
  [
    "AI Voiceovers",
    "Elevate demos with AI voice narration for enhanced and better user engagement.",
    "https://supademo.com/images/scale-06.avif",
    "AI Voiceovers"
  ],
  [
    "Guided HTML Demos",
    "Create guided demos by cloning and replicating your product in HTML.",
    "https://supademo.com/images/scale-07.avif",
    "Guided HTML Demos"
  ],
  [
    "Sandbox Demos",
    "Build free-exploration environments that fully emulate your product experience.",
    "https://supademo.com/images/scale-09.avif",
    "Sandbox Demos"
  ]
] as const;

export function SandboxScaleCarousel() {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, cards.length - 2);
  const offset = Math.min(page, pageCount - 1);

  return (
    <div className="sandbox-scale-carousel" aria-label="Supademo capabilities">
      <div className="sandbox-scale-viewport">
        <div
          className="sandbox-scale-track"
          style={{
            transform: `translateX(calc(-${offset} * (var(--sandbox-scale-card-width) + var(--sandbox-scale-gap))))`
          }}
        >
          {cards.map(([title, description, image, alt]) => (
            <article className="sandbox-scale-card" key={title}>
              <div className="sandbox-scale-card-media">
                <img src={image} alt={alt} loading="lazy" referrerPolicy="no-referrer" />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="sandbox-scale-controls">
        <button
          type="button"
          aria-label="Previous capability"
          disabled={offset === 0}
          onClick={() => setPage((current) => Math.max(0, current - 1))}
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Next capability"
          disabled={offset >= pageCount - 1}
          onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
        >
          →
        </button>
      </div>
      <p className="sandbox-scale-status" aria-live="polite">
        Showing capabilities {offset + 1}–{Math.min(offset + 3, cards.length)} of {cards.length}
      </p>
    </div>
  );
}
