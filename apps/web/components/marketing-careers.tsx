"use client";

import { useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const heroPhotos = [
  {
    src: "https://supademo.com/images/careers/team-2.avif",
    alt: "Farzad and Nazi at Web Summit",
    label: "New York, NY"
  },
  {
    src: "https://supademo.com/images/careers/team-19.avif",
    alt: "Team video call with hard hats",
    label: "Toronto, CA"
  },
  {
    src: "https://supademo.com/images/careers/team-1.avif",
    alt: "Team walking in Toronto",
    label: "Toronto, CA"
  },
  {
    src: "https://supademo.com/images/careers/team-16.avif",
    alt: "Deep dish pizza in Chicago",
    label: "Chicago, IL"
  }
] as const;

const teamPhotos = [
  ["https://supademo.com/images/team/vimal.avif", "Vimal - Team Member"],
  ["https://supademo.com/images/team/joseph.avif", "Joseph - Co-founder"],
  ["https://supademo.com/images/team/paulina.avif", "Paulina - Team Member"],
  ["https://supademo.com/images/team/tauqueer.avif", "Tauqueer - Team Member"],
  ["https://supademo.com/images/team/shek.avif", "Shek - Team Member"],
  ["https://supademo.com/images/team/koushik.avif", "Koushik - Co-founder"],
  ["https://supademo.com/images/team/hiba.avif", "Hiba - Team Member"],
  ["https://supademo.com/images/team/narayani.avif", "Narayani - Team Member"],
  ["https://supademo.com/images/team/fredo.avif", "Fredo - Team Member"],
  ["https://supademo.com/images/team/mehdi.avif", "Mehdi - Team Member"],
  ["https://supademo.com/images/team/farzad.avif", "Farzad - Team Member"],
  ["https://supademo.com/images/team/ryan.avif", "Ryan - Team Member"],
  ["https://supademo.com/images/team/mathew.avif", "Mathew - Team Member"],
  ["https://supademo.com/images/team/brendan.avif", "Brendan - Team Member"],
  ["https://supademo.com/images/team/aleks.avif", "Aleks - Team Member"],
  ["https://supademo.com/images/team/linkedin.avif", "Team Member"]
] as const;

export function MarketingCareersPage() {
  const [heroIndex, setHeroIndex] = useState(0);
  const hero =
    heroIndex === 0
      ? {
          src: "https://supademo.com/images/careers/team-14.avif",
          alt: "Team with Supademo neon sign",
          label: "New York, NY"
        }
      : heroPhotos[heroIndex - 1];

  return (
    <main className="careers-page" id="main">
      <MarketingHeader />
      <section className="careers-hero" aria-labelledby="careers-title">
        <div className="careers-hero-copy">
          <h1 id="careers-title">Grow your career with Supademo</h1>
          <p>
            Join Supademo, G2&apos;s Grid Leader for six consecutive quarters and ranked #5 fastest
            growing product of 2025.
          </p>
          <a className="marketing-button careers-primary" href="#open-roles">
            Explore open roles
          </a>
        </div>
        <div className="careers-hero-gallery" aria-label="Supademo team moments">
          {heroPhotos.map((photo, index) => (
            <img
              key={photo.src}
              className={`careers-hero-photo careers-hero-photo-${index + 1}${index === heroIndex ? " is-active" : ""}`}
              src={photo.src}
              alt={photo.alt}
              loading={index === 0 ? "eager" : "lazy"}
              referrerPolicy="no-referrer"
            />
          ))}
          <img
            className="careers-hero-central"
            src={hero.src}
            alt={hero.alt}
            loading="eager"
            referrerPolicy="no-referrer"
          />
          <button
            className="careers-gallery-arrow careers-gallery-arrow-left"
            type="button"
            onClick={() => setHeroIndex((heroIndex - 1 + heroPhotos.length) % heroPhotos.length)}
            aria-label="Previous team moment"
          >
            ←
          </button>
          <button
            className="careers-gallery-arrow careers-gallery-arrow-right"
            type="button"
            onClick={() => setHeroIndex((heroIndex + 1) % heroPhotos.length)}
            aria-label="Next team moment"
          >
            →
          </button>
          <span className="careers-gallery-label">
            <i aria-hidden="true" />
            {hero.label}
          </span>
        </div>
      </section>
      <section className="careers-impact" aria-labelledby="careers-impact-title">
        <h2 id="careers-impact-title">The Supademo Impact</h2>
        <div className="careers-impact-grid">
          <div>
            <strong>
              11<span>k+</span>
            </strong>
            <p>passionate users around the world</p>
          </div>
          <div>
            <strong>
              0<span>#</span>
            </strong>
            <p>fastest growing on G2 out of 100,000+ products</p>
          </div>
          <div>
            <strong>
              5<span>+</span>
            </strong>
            <p>Countries represented by users</p>
          </div>
        </div>
      </section>
      <section className="careers-team-collage" aria-label="Supademo team">
        {teamPhotos.map(([src, alt], index) => (
          <img
            key={src}
            className={`careers-team-photo careers-team-photo-${index + 1}`}
            src={src}
            alt={alt}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ))}
      </section>
      <section className="careers-open-roles" id="open-roles" aria-labelledby="careers-roles-title">
        <div className="careers-open-roles-brand">
          <span aria-hidden="true">S</span> supademo
        </div>
        <div className="careers-open-roles-grid">
          <div>
            <p>
              Supademo helps teams demonstrate products more effectively with AI. We&apos;re backed
              by world-class investors and we&apos;re searching for founding members to help
              accelerate our growth and impact.
            </p>
            <p>
              As one of the earliest members of a fast-growing team, you&apos;ll have an opportunity
              to develop, test, and experiment with a high degree of ownership. Success will
              naturally lead to rapid progression and leadership opportunities.
            </p>
          </div>
          <div>
            <h2 id="careers-roles-title">Open roles</h2>
            <p>No positions available at this time</p>
          </div>
        </div>
      </section>
      <section className="careers-story" aria-labelledby="careers-story-title">
        <img
          src="https://supademo.com/images/founders-headshot.avif"
          alt="Supademo founders - Joseph and Koushik"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div>
          <p className="careers-eyebrow">Made to show, built to grow</p>
          <h2 id="careers-story-title">
            Helping 1 million businesses demonstrate products more effectively
          </h2>
          <p>
            We&apos;re building the clearest way for teams to share product value, one thoughtful
            interaction at a time.
          </p>
        </div>
      </section>
      <MarketingFooter variant="showcase" />
    </main>
  );
}
