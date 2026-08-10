"use client";

import { useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const aiFeatures = [
  [
    "Run 24/7 demo agents that qualify and guide buyers",
    "Go beyond passive demos with AI Demo Agents powered by RouteHub. Answer questions in any time zone or language, qualify intent, surface the right Supademos, videos, docs, and pricing in real time, and guide buyers through proof in a learn-by-doing experience.",
    "https://supademo.com/images/ai/ai-4.avif",
    "AI Demo Agent qualifying a buyer through an interactive conversational product walkthrough",
    ["AI Demo Agents", "RouteHub", "Always-On", "Interactive Proof", "Intelligent Handoff"]
  ],
  [
    "Create polished demos faster with AI",
    "Turn real product flows into polished, interactive demos with AI-generated text, scripts, voiceovers, and translations. Go from capture to audience-ready demo much faster, without starting from scratch every time.",
    "https://supademo.com/images/ai/ai-1.avif",
    "AI demo creation interface showing automated step text, guided flows, and AI voiceover generation for interactive product demos",
    ["AI Text & Scripts", "AI Voiceovers", "Voice Cloning", "AI Translation", "AI Demo Audits"]
  ],
  [
    "Personalize every demo without duplicate work",
    "Use AI editing, variables, and contextual content updates to tailor demos by persona, role, company, region, or use case. One core demo can support many audiences without multiplying manual work.",
    "https://supademo.com/images/ai/ai-2.avif",
    "AI personalization interface showing dynamic variables and persona-based demo customization",
    ["AI Data Editing", "Dynamic Variables", "Persona-Based Experiences", "Localization"]
  ],
  [
    "Audit and improve demos over time with AI",
    "Use AI Demo Audits and optimization signals to understand what is working, where buyers drop off, and what to improve next. Instead of guessing why a demo underperforms, teams get clearer feedback on how to strengthen it.",
    "https://supademo.com/images/ai/ai-3.avif",
    "AI analytics dashboard showing engagement metrics, drop-off analysis, and optimization insights for interactive demos",
    ["AI Demo Audits", "Drop-Off Detection", "Optimization Signals", "Performance Trends"]
  ]
] as const;

const aiToolkit = [
  [
    "AI Demo Agents",
    "Run always-on agents that answer questions, qualify buyers, and surface the right Supademos, videos, docs, and proof in real time.",
    "/ai/demo-agents"
  ],
  [
    "AI Demo Audits",
    "Score demo quality, detect friction, and get actionable recommendations to improve engagement and conversion.",
    "/features/ai-demo-audit"
  ],
  [
    "AI Text & Script Generation",
    "Generate step text, scripts, and guided flows tailored to your audience, use case, or industry.",
    "/features"
  ],
  [
    "AI Data Editing",
    "Update text, numbers, tables, and on-screen content with simple prompts instead of manual rework.",
    "/features/ai-data-edit"
  ],
  [
    "AI Voiceovers",
    "Add human-like narration to demos instantly, with flexible voices, accents, and languages.",
    "/features/ai-voiceover"
  ],
  [
    "AI Voice Cloning",
    "Scale demos that sound like you, so content stays personal, recognizable, and on-brand.",
    "/features/ai-voice-cloning"
  ],
  [
    "AI Translation and Localization",
    "Translate demo text and voice so one experience can support buyers and users across regions.",
    "/features/ai-translation"
  ],
  [
    "AI Avatars",
    "Add a visual presenter to your demo experience for more guided walkthroughs and richer narration.",
    "/features"
  ]
] as const;

const agentBenefits = [
  [
    "Discovery and qualification",
    "Engage prospects and users through a conversational interface that asks follow-up questions, identifies intent, and helps separate high-fit buyers from low-intent traffic."
  ],
  [
    "Interactive proof in context",
    "Surface the right Supademos, tutorials, pricing pages, videos, and docs based on what the buyer asks. Users can open multiple demos, explore at their own pace, or let the agent step through the experience for them."
  ],
  [
    "Smart actions and handoff",
    "Book a meeting, start a trial, recommend the next tutorial, or route to a human based on your rules, goals, and CTA paths."
  ],
  [
    "Reporting and optimization",
    "See what buyers asked, which proof assets they opened, where conversations converted, and where knowledge gaps still exist so you can improve both the agent and the demos behind it."
  ]
] as const;

export function MarketingAiPage() {
  const [featuredCategory, setFeaturedCategory] = useState("Featured");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const companyCategories = [
    "Featured",
    "Software",
    "Finance & Banking",
    "Healthcare",
    "Government"
  ] as const;

  return (
    <>
      <main className="marketing-ai-page" id="main">
        <MarketingHeader />
        <section className="marketing-ai-hero" aria-labelledby="marketing-ai-title">
          <div className="marketing-ai-hero-grid" aria-hidden="true" />
          <div className="marketing-ai-hero-content">
            <p className="marketing-ai-badge">Supademo AI</p>
            <h1 id="marketing-ai-title">Build, qualify, and scale with AI demo agents</h1>
            <p className="marketing-ai-description">
              Supademo AI brings together demo agents, AI demo audits, AI text, AI voiceovers, and
              more to help teams guide buyers and move deals forward around the clock.
            </p>
            <div className="marketing-ai-actions">
              <a className="marketing-button marketing-ai-primary" href="/ai/demo-agents">
                Learn more <span aria-hidden="true">→</span>
              </a>
              <a className="marketing-button marketing-ai-secondary" href="/product-demo">
                Schedule a demo
              </a>
            </div>
          </div>
        </section>
        <section className="marketing-ai-proof" aria-labelledby="marketing-ai-proof-title">
          <div className="marketing-ai-proof-inner">
            <div className="marketing-ai-proof-copy">
              <h2 id="marketing-ai-proof-title">
                Trusted by 200,000+ top operators and 3,000+ paying organizations
              </h2>
              <p>Explore</p>
            </div>
            <div className="marketing-ai-awards" aria-label="Awards and recognition">
              <img
                src="https://supademo.com/images/supademo-rating-03.webp"
                alt="Supademo ratings and recognition"
                referrerPolicy="no-referrer"
              />
              <img
                src="https://supademo.com/images/supademo-rating-02.webp"
                alt="Supademo ratings and recognition"
                referrerPolicy="no-referrer"
              />
            </div>
            <fieldset className="marketing-ai-company-panel">
              <legend>
                Explore{" "}
                <span className="marketing-ai-company-picker">
                  <button
                    type="button"
                    aria-haspopup="listbox"
                    aria-expanded={categoryOpen}
                    onClick={() => setCategoryOpen((open) => !open)}
                  >
                    {featuredCategory}⌄
                  </button>
                  {categoryOpen ? (
                    <span role="listbox" aria-label="Company categories">
                      {companyCategories.map((category) => (
                        <button
                          type="button"
                          role="option"
                          aria-selected={featuredCategory === category}
                          key={category}
                          onClick={() => {
                            setFeaturedCategory(category);
                            setCategoryOpen(false);
                          }}
                        >
                          {category}
                        </button>
                      ))}
                    </span>
                  ) : null}
                </span>{" "}
                companies that trust Supademo
              </legend>
              <div className="marketing-ai-logo-strip" aria-label="Featured companies">
                {[
                  ["Spare", "spare.svg"],
                  ["beehiiv", "beehiiv.avif"],
                  ["Lightspeed", "lightspeed.svg"],
                  ["Easy", "easy.svg"],
                  ["Bullhorn", "bullhorn.svg"],
                  ["VRIFY", "vrify.svg"],
                  ["Jotform", "jotform.svg"],
                  ["Anvil", "useanvil.svg"],
                  ["Ledger", "ledger-logo.svg"],
                  ["Visma", "visma.avif"]
                ].map(([name, asset]) => (
                  <img
                    key={name}
                    src={`https://supademo.com/logos/${asset}`}
                    alt={`${name} logo`}
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
            </fieldset>
          </div>
        </section>
        <section className="marketing-ai-features" aria-labelledby="marketing-ai-features-title">
          <div className="marketing-ai-section-heading">
            <p className="marketing-ai-eyebrow">AI-powered features</p>
            <h2 id="marketing-ai-features-title">
              One AI suite for demo creation, qualification, and growth
            </h2>
            <p>
              Supademo AI helps teams do more than generate demo copy or voiceovers. It gives them
              one system to create demos faster, personalize them at scale, audit performance, and
              run AI agents that qualify buyers and guide them with interactive proof.
            </p>
          </div>
          <div className="marketing-ai-feature-rows">
            {aiFeatures.map(([title, description, image, alt, tags], index) => (
              <article
                className={`marketing-ai-feature-row ${index % 2 ? "is-reversed" : ""}`}
                key={title}
              >
                <div className="marketing-ai-feature-art">
                  <img src={image} alt={alt} loading="lazy" />
                </div>
                <div className="marketing-ai-feature-copy">
                  <span className="marketing-ai-feature-index">0{index + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <div className="marketing-ai-tags">
                    {tags.map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section className="marketing-ai-toolkit" aria-labelledby="marketing-ai-toolkit-title">
          <div className="marketing-ai-toolkit-core">
            <div className="marketing-ai-section-heading marketing-ai-toolkit-heading">
              <p className="marketing-ai-eyebrow">AI capabilities</p>
              <h2 id="marketing-ai-toolkit-title">A complete AI toolkit for modern demo teams</h2>
              <p>
                Supademo AI is built to support the full lifecycle, from creation and
                personalization to optimization and always-on qualification. Use AI to write better
                demos, localize faster, add voice, improve performance, and turn your best content
                into an interactive AI buying experience.
              </p>
            </div>
            <div className="marketing-ai-toolkit-grid">
              {aiToolkit.map(([title, description, href]) => (
                <article key={title}>
                  <span aria-hidden="true">✦</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <a href={href}>
                    Learn more <span aria-hidden="true">→</span>
                  </a>
                </article>
              ))}
            </div>
            <div className="marketing-ai-toolkit-cta">
              <a className="marketing-button marketing-ai-primary" href="/product-demo">
                Schedule live demo <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
          <section
            className="marketing-ai-agent-section"
            aria-labelledby="marketing-ai-agent-title"
          >
            <div className="marketing-ai-section-heading marketing-ai-agent-heading">
              <p className="marketing-ai-eyebrow">AI Demo Agents</p>
              <h2 id="marketing-ai-agent-title">
                Qualify, educate, and convert with agents that never go offline
              </h2>
              <p>
                Supademo AI Demo Agents turn your demos, docs, and proof assets into an interactive
                buying and enablement experience. They can answer questions 24/7, guide users
                through multiple Supademos, and help buyers learn by doing or follow an agent-guided
                walkthrough, all before handing off to a rep when the time is right.
              </p>
            </div>
            <div className="marketing-ai-agent-benefits">
              {agentBenefits.map(([title, description]) => (
                <article key={title}>
                  <span className="marketing-ai-benefit-icon" aria-hidden="true">
                    ✦
                  </span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
            <div className="marketing-ai-agent-cta">
              <a className="marketing-button marketing-ai-primary" href="/product-demo">
                Schedule live demo <span aria-hidden="true">→</span>
              </a>
            </div>
          </section>
        </section>
      </main>
      <MarketingFooter variant="showcase" />
    </>
  );
}
