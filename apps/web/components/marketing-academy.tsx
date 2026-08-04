"use client";

import { useState } from "react";
import { MarketingFooter } from "./marketing-chrome";

const lessonCards = [
  [
    "Creating Website Demos",
    "Learn how to create and embed interactive website demos that convert visitors into qualified users.",
    "website",
    "/academy/playbooks/creating-website-demos",
    "website-demo.avif"
  ],
  [
    "Creating Demo Centers",
    "Build curated collections of interactive demos organized by use case, role, or industry.",
    "centers",
    "/academy/playbooks/creating-demo-centers",
    "demo-centers.avif"
  ],
  [
    "Setting Up Route Hub",
    "Learn how to create personalized, multi-path demo experiences that route every viewer to the right content automatically using Route Hub.",
    "route",
    "/academy/playbooks/setting-up-route-hub",
    "route-hub.avif"
  ],
  [
    "Creating Sandbox Demos",
    "Learn how to create interactive, clone-based sandbox environments that let users freely explore your product.",
    "sandbox",
    "/academy/playbooks/creating-sandbox-demos",
    "sandbox-demo.avif"
  ],
  [
    "Creating Trackable Demo Leave-Behinds",
    "Share trackable demo leave-behinds that reinforce your pitch and reveal buyer engagement.",
    "leave-behind",
    "/academy/playbooks/creating-demo-leave-behinds",
    "trackable-leave-behind.avif"
  ],
  [
    "Creating Mobile Product Demos",
    "Create polished, interactive mobile product demos with the desktop emulator or extension.",
    "mobile",
    "/academy/playbooks/creating-mobile-demos",
    "mobile-demos.avif"
  ],
  [
    "Trigger Interactive Demos Inside Your App",
    "Bring interactive demos into your product experience so users can discover the right feature at the right moment.",
    "in-app",
    "/academy/playbooks/trigger-demos-inside-app",
    "in-app-demos.avif"
  ]
] as const;

const sidebarItems = [
  ["Overview", "overview"],
  ["Playbooks", "playbooks"],
  ["Additional Resources", "resources"],
  ["Create Your Demo", "create"],
  ["Edit & Personalize", "edit"],
  ["Share", "share"],
  ["Measure & Improve", "measure"],
  ["Workspace Foundations", "workspace"]
] as const;

const guideCards = [
  [
    "Welcome to the Academy",
    "Learn how our Academy is organized: tactical Playbooks for specific use cases, and structured Courses with step-by-step lessons to master every Supademo feature.",
    "great-demos-dec-min.jpg",
    "6e4L66IfDCw"
  ],
  [
    "3 Minute Overview",
    "Watch this quick intro video to learn how Supademo helps you create stunning interactive demos in minutes.",
    "demo-thumbnail-dec-min.jpg",
    "WCS0CFnZ1Vk"
  ],
  [
    "Recommended Use Cases",
    "Explore recommended use cases on how and where you should use interactive demos.",
    "academy-structure-min.jpg",
    "nqRWF3ntaE4"
  ]
] as const;

const trainingCard = {
  title: "Fastest way to master Supademo",
  description:
    "Join a free training session to get hands-on guidance, ask questions in real-time, and leave with actionable skills to create demos that convert.",
  href: "/product-demo/live-training"
};

function LessonArt({ variant, src, title }: { variant: string; src: string; title: string }) {
  return (
    <div className={`academy-lesson-art academy-lesson-art-${variant}`}>
      <img
        src={`https://supademo.com/images/academy/playbooks/${src}`}
        alt={title}
        loading="eager"
      />
    </div>
  );
}

export function MarketingAcademy() {
  const [activeNav, setActiveNav] = useState("overview");
  const [slide, setSlide] = useState(0);
  const [activeGuide, setActiveGuide] = useState<(typeof guideCards)[number] | null>(null);
  const visibleLessons = lessonCards.slice(slide, slide + 3);

  function moveSlide(direction: -1 | 1) {
    setSlide((current) => Math.max(0, Math.min(lessonCards.length - 3, current + direction)));
  }

  return (
    <main className="academy-page" id="main">
      <header className="academy-topbar">
        <a className="academy-logo" href="/academy">
          <img
            src="https://supademo.com/images/academy/supademo-academy-logo.svg"
            alt="Supademo Academy"
            width="138"
            height="28"
          />
        </a>
        <nav>
          <a href="/auth">Login</a>
          <a className="academy-start" href="/signup">
            Start for free <span aria-hidden="true">→</span>
          </a>
        </nav>
      </header>
      <div className="academy-layout">
        <aside className="academy-sidebar" aria-label="Academy navigation">
          <nav>
            {sidebarItems.slice(0, 3).map(([label, id], index) => {
              const href = ["/academy", "/academy/playbooks", "/academy/additional-resources"][
                index
              ];
              const icon = ["⌂", "▣", "□"][index];
              return (
                <a
                  aria-current={activeNav === id ? "page" : undefined}
                  className={activeNav === id ? "is-active" : undefined}
                  href={href}
                  key={id}
                >
                  <span aria-hidden="true">{icon}</span>
                  {label}
                </a>
              );
            })}
            <div className="academy-sidebar-group">
              <span>COURSES</span>
              {sidebarItems.slice(3).map(([label, id], index) => {
                const href = [
                  "/academy/create-your-demo",
                  "/academy/edit-and-refine",
                  "/academy/share",
                  "/academy/measure-and-improve",
                  "/academy/workspace-foundations"
                ][index];
                const icon = ["◫", "↗", "⌘", "▥", "▤"][index];
                return (
                  <a
                    aria-current={activeNav === id ? "page" : undefined}
                    className={activeNav === id ? "is-active" : undefined}
                    href={href}
                    key={id}
                  >
                    <span aria-hidden="true">{icon}</span>
                    {label}
                  </a>
                );
              })}
            </div>
          </nav>
        </aside>
        <div className="academy-content">
          <section className="academy-hero" aria-labelledby="academy-title">
            <div className="academy-hero-panel">
              <h1 id="academy-title">Supademo Academy</h1>
              <p>
                Everything you need to create stunning interactive demos. Start with the basics,
                then advance to personalization, analytics, and more.
              </p>
            </div>
          </section>
          <section className="academy-lessons" aria-labelledby="academy-lessons-title">
            <div className="academy-section-heading">
              <h2 id="academy-lessons-title">Explore lessons by outcome</h2>
              <a href="/academy/playbooks">View all</a>
            </div>
            <div className="academy-lesson-grid">
              {visibleLessons.map(([title, description, variant, href, src]) => (
                <a className="academy-lesson-card" href={href} key={title}>
                  <LessonArt variant={variant} src={src} title={title} />
                  <p>{description}</p>
                </a>
              ))}
            </div>
            <div className="academy-carousel-controls">
              <button
                type="button"
                onClick={() => moveSlide(-1)}
                disabled={slide === 0}
                aria-label="Previous"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => moveSlide(1)}
                disabled={slide >= lessonCards.length - 3}
                aria-label="Next"
              >
                →
              </button>
            </div>
          </section>
          <section className="academy-guides" aria-label="Getting started guides">
            {guideCards.map(([title, description, image], index) => (
              <button
                type="button"
                className={`academy-guide-card academy-guide-card-${index}`}
                key={title}
                onClick={() => setActiveGuide(guideCards[index])}
              >
                <div className="academy-guide-card-header">
                  <h3>{title}</h3>
                  <span aria-hidden="true">▶</span>
                </div>
                <div className="academy-guide-card-body">
                  <div className="academy-guide-card-art">
                    <img
                      src={`https://supademo.com/images/academy/${image}`}
                      alt={title}
                      loading="lazy"
                    />
                  </div>
                  <p>{description}</p>
                </div>
              </button>
            ))}
            <a
              className="academy-guide-card academy-guide-card-training"
              href={trainingCard.href}
              target="_blank"
              rel="noreferrer"
            >
              <div className="academy-guide-card-header">
                <h3>{trainingCard.title}</h3>
                <span aria-hidden="true">↗</span>
              </div>
              <div className="academy-guide-card-body academy-training-card-body">
                <div className="academy-training-headshots" aria-hidden="true">
                  {[
                    ["Trainer 1", "paulina-headshot.avif"],
                    ["Trainer 2", "fredo-headshot.avif"],
                    ["Trainer 3", "demo-rep-1.avif"]
                  ].map(([alt, src]) => (
                    <img
                      alt={alt}
                      key={src}
                      src={`https://supademo.com/headshots/${src}`}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ))}
                  <span>+</span>
                </div>
                <p>{trainingCard.description}</p>
                <span className="academy-training-link">Join Live Training ↗</span>
              </div>
            </a>
          </section>
          <section className="academy-cta" aria-labelledby="academy-cta-title">
            <h2 id="academy-cta-title">Ready to get started?</h2>
            <p>
              Learn how to create your first interactive demo with our step-by-step courses and
              lessons.
            </p>
            <button type="button" onClick={() => setActiveNav("create")}>
              Start the Course <span aria-hidden="true">→</span>
            </button>
          </section>
        </div>
      </div>
      {activeGuide ? (
        <div
          className="academy-video-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="academy-video-title"
        >
          <div className="academy-video-modal-inner">
            <button
              type="button"
              className="academy-video-close"
              aria-label="Close video"
              onClick={() => setActiveGuide(null)}
            >
              <span aria-hidden="true">×</span>
            </button>
            <div className="academy-video-frame">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeGuide[3]}?autoplay=1`}
                title={activeGuide[0]}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="academy-video-caption">
              <h2 id="academy-video-title">{activeGuide[0]}</h2>
            </div>
          </div>
        </div>
      ) : null}
      <MarketingFooter variant="showcase" />
    </main>
  );
}
