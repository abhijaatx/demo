"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

export type UseCaseScaleCard = {
  title: string;
  description: string;
  image: string;
  alt: string;
};

export type UseCasePopularMode = {
  label: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  href: string;
};

export function UseCaseTrustExplorer() {
  const [open, setOpen] = useState(false);

  return (
    <div className="use-case-detail-trust-explorer">
      <span>Explore</span>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Featured <span aria-hidden="true">⌄</span>
      </button>
      <span>companies that trust Supademo</span>
      {open ? (
        <div
          className="use-case-detail-trust-explorer-menu"
          role="listbox"
          aria-label="Company collection"
        >
          <button type="button" role="option" aria-selected="true" onClick={() => setOpen(false)}>
            Featured
          </button>
          <button type="button" role="option" aria-selected="false" onClick={() => setOpen(false)}>
            All companies
          </button>
          <button type="button" role="option" aria-selected="false" onClick={() => setOpen(false)}>
            Customer stories
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function UseCaseScaleRail({ cards }: { cards: readonly UseCaseScaleCard[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleCards = Math.max(cards.length - 3, 0);
  const boundedIndex = Math.min(activeIndex, visibleCards);

  return (
    <div className="use-case-detail-scale-rail-wrap">
      <div className="use-case-detail-scale-rail" data-active-index={boundedIndex}>
        <div
          className="use-case-detail-scale-track"
          style={{ "--use-case-scale-index": boundedIndex } as CSSProperties}
        >
          {cards.map((card) => (
            <article className="use-case-detail-scale-card" key={card.title}>
              <div className="use-case-detail-scale-card-image">
                <img src={card.image} alt={card.alt} loading="lazy" referrerPolicy="no-referrer" />
              </div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </div>
      <div className="use-case-detail-scale-controls" aria-label="Feature carousel controls">
        <button
          type="button"
          aria-label="Previous feature"
          onClick={() => setActiveIndex((index) => Math.max(index - 1, 0))}
          disabled={boundedIndex === 0}
        >
          ←
        </button>
        <button
          type="button"
          aria-label="Next feature"
          onClick={() => setActiveIndex((index) => Math.min(index + 1, visibleCards))}
          disabled={boundedIndex === visibleCards}
        >
          →
        </button>
      </div>
    </div>
  );
}

export function UseCasePopularPanel({
  modes,
  initialLabel
}: {
  modes: readonly UseCasePopularMode[];
  initialLabel?: string;
}) {
  const initialIndex = Math.max(
    modes.findIndex((mode) => mode.label === initialLabel),
    0
  );
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const activeMode = modes[activeIndex] ?? modes[0];

  if (!activeMode) return null;

  return (
    <div className="use-case-detail-popular-panel">
      <div className="use-case-detail-popular-tabs" role="tablist" aria-label="Use cases by team">
        {modes.map((mode, index) => (
          <button
            key={mode.label}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-controls="use-case-popular-panel"
            onClick={() => setActiveIndex(index)}
          >
            {mode.label}
          </button>
        ))}
      </div>
      <article
        className="use-case-detail-popular-card"
        id="use-case-popular-panel"
        role="tabpanel"
        aria-live="polite"
      >
        <div className="use-case-detail-popular-copy">
          <h3>{activeMode.title}</h3>
          <p>{activeMode.description}</p>
          <a className="use-case-detail-inline-link" href={activeMode.href}>
            Supademo for {activeMode.label} <span aria-hidden="true">→</span>
          </a>
        </div>
        <img
          src={activeMode.image}
          alt={activeMode.imageAlt}
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      </article>
    </div>
  );
}
