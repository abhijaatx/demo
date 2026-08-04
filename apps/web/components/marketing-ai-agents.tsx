"use client";

import { useEffect, useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const trustBadges = ["G2 Leader", "Best ROI", "Top 100", "Top 50", "Grid Leader"];

const featureCards = [
  [
    "Starts with smart discovery",
    "Supademo starts every demo by understanding who's on the other side. It asks about their role, goals, pain points, and what brought them there, then uses that context to shape the entire experience."
  ],
  [
    "Personalizes every demo in real time",
    "Based on what each buyer shares, agents surface the most relevant demos, videos, decks, content, and use cases for that specific person. No generic walkthroughs. No two demo sessions are exactly the same."
  ],
  [
    "Score, summarize & route buyers to the right next step",
    "Agents identify high-intent visitors, recommend next steps, and give your team a full session summary with key takeaways and action items. Every conversation also helps the agent improve the next one."
  ]
] as const;

const demoExperienceSteps = [
  "Starts with smart discovery",
  "Personalizes every demo in real time",
  "Scores, summarizes, and routes the next step",
  "Improves the next conversation"
] as const;

export function MarketingAiAgentsPage() {
  const [demoOpen, setDemoOpen] = useState(false);
  const [demoExperienceStep, setDemoExperienceStep] = useState(0);

  useEffect(() => {
    if (!demoOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDemoOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [demoOpen]);

  return (
    <main className="marketing-ai-agents-page marketing-ai-page" id="main">
      <MarketingHeader />
      <section className="marketing-ai-agents-hero" aria-labelledby="marketing-ai-agents-title">
        <div className="marketing-ai-agents-copy">
          <p className="marketing-ai-agents-badge">
            <span aria-hidden="true">↗</span> AI Demo Agent: agentic demos 24/7
          </p>
          <h1 id="marketing-ai-agents-title">
            Run demos on autopilot
            <span className="marketing-ai-agents-play" aria-hidden="true">
              ▷
            </span>{" "}
            with
            <br /> AI Demo Agents
          </h1>
          <p className="marketing-ai-agents-description">
            Deploy self-improving AI agents that run discovery, answer questions, handle objections,
            and showcase interactive content to drive warmer leads from day one.
          </p>
          <div className="marketing-ai-agents-actions">
            <a className="marketing-button marketing-ai-agents-primary" href="/product-demo">
              Schedule a demo <span aria-hidden="true">→</span>
            </a>
            <button
              className="marketing-button marketing-ai-agents-secondary"
              type="button"
              onClick={() => setDemoOpen(true)}
              aria-haspopup="dialog"
            >
              Try instant AI demo
            </button>
          </div>
        </div>
        <figure className="marketing-ai-agents-preview">
          <img
            src="https://supademo.com/images/hero-ai-demo-agent.avif"
            alt="AI Demo Agent preview"
            loading="eager"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </figure>
      </section>
      <section
        className="marketing-ai-agents-trust"
        aria-labelledby="marketing-ai-agents-trust-title"
      >
        <div className="marketing-ai-agents-trust-top">
          <h2 id="marketing-ai-agents-trust-title">
            Trusted by 200,000+ top operators and 3,000+ paying organizations
          </h2>
          <div className="marketing-ai-agents-badges" aria-label="Awards and recognition">
            {trustBadges.map((badge) => (
              <span key={badge}>{badge}</span>
            ))}
          </div>
        </div>
        <div className="marketing-ai-agents-companies" aria-label="Companies that trust Supademo">
          <p>
            Explore <strong>Featured⌄</strong> companies that trust Supademo
          </p>
          <div>
            {[
              "spare",
              "Jotform",
              "Anvil",
              "beehiiv",
              "LEDGER",
              "VISMA",
              "lightspeed",
              "eng",
              "Relevance AI",
              "easy",
              "Alibaba",
              "Bullhorn",
              "Typeform",
              "NetApp",
              "RE2B",
              "TURO",
              "concentrix",
              "VRIFY",
              "POSH",
              "SIEMENS"
            ].map((company) => (
              <span key={company}>{company}</span>
            ))}
          </div>
        </div>
        <aside className="marketing-ai-agents-promo" aria-label="AI Demo Agent prompt">
          <span aria-hidden="true">ϟ</span>
          <strong>Meet Supademo&apos;s new AI Demo Agent</strong>
          <a className="marketing-button" href="/signup?source=ai-agent">
            Talk to it
          </a>
        </aside>
      </section>
      <section
        className="marketing-ai-agents-features marketing-ai-agents-mobile-features"
        aria-labelledby="marketing-ai-agents-features-title"
      >
        <p className="marketing-announcement">AI-powered features</p>
        <h2 id="marketing-ai-agents-features-title">Give every buyer your best demo experience</h2>
        <div className="marketing-ai-agents-feature-grid">
          {featureCards.map(([title, description], index) => (
            <article key={title}>
              <span aria-hidden="true">0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <a href="/features">Learn more →</a>
            </article>
          ))}
        </div>
      </section>
      <section
        className="marketing-ai-agents-discovery"
        aria-labelledby="marketing-ai-agents-discovery-title"
      >
        <div className="marketing-ai-agents-how-panel">
          <div className="marketing-ai-agents-how-copy">
            <p className="marketing-announcement">HOW IT WORKS</p>
            <h2 id="marketing-ai-agents-discovery-title">
              Give every buyer your best demo experience
            </h2>
            <p>
              Replace dead-end demo forms with an always-on experience that answers questions, shows
              the product, and guides each buyer to the next step based on what matters most to
              them.
            </p>
            <div
              className="marketing-ai-agents-carousel-controls"
              aria-label="Demo experience steps"
            >
              <button
                type="button"
                aria-label="Previous card"
                disabled={demoExperienceStep === 0}
                onClick={() => setDemoExperienceStep((step) => Math.max(0, step - 1))}
              >
                ‹
              </button>
              {demoExperienceSteps.map((step, index) => (
                <button
                  key={step}
                  type="button"
                  aria-label={`Go to card ${index + 1}`}
                  aria-current={demoExperienceStep === index ? "true" : undefined}
                  className={demoExperienceStep === index ? "is-active" : undefined}
                  onClick={() => setDemoExperienceStep(index)}
                />
              ))}
              <button
                type="button"
                aria-label="Next card"
                disabled={demoExperienceStep === demoExperienceSteps.length - 1}
                onClick={() =>
                  setDemoExperienceStep((step) =>
                    Math.min(demoExperienceSteps.length - 1, step + 1)
                  )
                }
              >
                ›
              </button>
            </div>
          </div>
          <div className="marketing-ai-agents-how-preview" aria-label="AI demo agent preview">
            <div className="marketing-ai-agents-browser-bar">
              <span />
              <span />
              <span />
              <strong>website.com/agent</strong>
            </div>
            <div className="marketing-ai-agents-how-screen">
              <div className="marketing-ai-agents-chat">
                <strong>
                  {demoExperienceStep === 0
                    ? "Exploring tool for sales enablement, 50-person team"
                    : demoExperienceStep === 1
                      ? "Personalizing the experience for Joseph Lee"
                      : demoExperienceStep === 2
                        ? "Scoring intent and preparing the next step"
                        : "Learning from this conversation"}
                </strong>
                <p>
                  {demoExperienceStep === 0
                    ? "Thanks for the context. What would you like to solve first?"
                    : demoExperienceStep === 1
                      ? "Here are the demos and proof points most relevant to your goals."
                      : demoExperienceStep === 2
                        ? "I have the context your team needs to follow up with confidence."
                        : "This conversation helps the agent improve the next one."}
                </p>
                <span>Interactive Demo</span>
              </div>
              <div className="marketing-ai-agents-product-window">
                <strong>Welcome, Joseph Lee</strong>
                <div>
                  <span>5.9K</span>
                  <span>72%</span>
                  <span>4:36</span>
                </div>
                <div className="marketing-ai-agents-bars">
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="marketing-ai-agents-discovery-grid">
          {featureCards.map(([title, description], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        className="marketing-ai-agents-problem"
        aria-labelledby="marketing-ai-agents-problem-title"
      >
        <div className="marketing-ai-agents-section-heading">
          <p className="marketing-announcement">THE PROBLEM</p>
          <h2 id="marketing-ai-agents-problem-title">Your demo process is losing you deals</h2>
          <p>
            Buyers want to see your product before they talk to sales. But today, they have to fill
            out a form, wait for a rep, and hope the timing works. Most don&apos;t bother. They lose
            interest, evaluate competitors, and move on because your demo was gated behind your
            availability.
          </p>
        </div>
        <div className="marketing-ai-agents-problem-grid">
          {[
            [
              "Buyers can't see your product",
              "Your prospect lands at 11pm, but your site says 'Book a demo.' By morning, they've shortlisted a competitor that let them explore instantly."
            ],
            [
              "Reps repeat the same questions",
              "Your team answers the same pricing, integration, and security questions every week instead of spending that time closing."
            ],
            [
              "Static assets don't convert",
              "Decks, one-pagers, and case studies get skimmed. Without guided context, even great content fails to prove value."
            ],
            [
              "Demos are limited by capacity",
              "Your team has limited hours, but buyers have questions 24/7 across every time zone, meaning prospects slip through the cracks."
            ],
            [
              "Self-improving expertise",
              "The agent learns from every conversation, improving what it shows, asks, and recommends over time."
            ],
            [
              "Compounding value",
              "Every interaction sharpens qualification, surfaces better proof, and improves conversion without adding headcount."
            ]
          ].map(([title, description], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </section>
      <section
        className="marketing-ai-agents-value"
        aria-labelledby="marketing-ai-agents-value-title"
      >
        <div className="marketing-ai-agents-value-copy">
          <p className="marketing-announcement">Compounding intelligence</p>
          <h2 id="marketing-ai-agents-value-title">Self-improving expertise</h2>
          <p>
            Every conversation makes the next conversation clearer. Keep approved product knowledge
            close to the agent and use real questions to improve the paths people see.
          </p>
          <h3>Compounding value</h3>
          <p>
            One source of truth becomes a library of useful answers, guided demos, and high-intent
            handoffs that work around the clock.
          </p>
        </div>
        <div className="marketing-ai-agents-value-stack" aria-label="Compounding value steps">
          {["Learn from conversations", "Improve the source", "Guide the next buyer"].map(
            (item, index) => (
              <div key={item}>
                <span>0{index + 1}</span>
                <strong>{item}</strong>
                <small>Always-on product expertise</small>
              </div>
            )
          )}
        </div>
      </section>
      <section
        className="marketing-ai-agents-setup"
        aria-labelledby="marketing-ai-agents-setup-title"
      >
        <div className="marketing-ai-agents-section-heading">
          <p className="marketing-announcement">GO LIVE IN DAYS, NOT MONTHS</p>
          <h2 id="marketing-ai-agents-setup-title">Set up your agent in hours, not weeks</h2>
          <p>
            Train the agent on your best demo calls, add sales collateral, set guardrails, and go
            live. Every conversation teaches the agent what buyers care about, so it improves
            automatically, not manually.
          </p>
        </div>
        <div className="marketing-ai-agents-setup-grid">
          {[
            [
              "Add interactive demos, decks, pricing and case studies",
              "Upload the assets your team already uses. The agent stays grounded in approved sources with no hallucination and no off-brand answers. As you add or update content, the agent evolves with you."
            ],
            [
              "Guide buyers with conversation, interactive demos and approved assets",
              "Answer questions by text or voice, ask clarifying questions, and pull up the most relevant Supademos, docs, pricing, or case studies in real time."
            ],
            [
              "Qualify and route buyers to the right actions, around the clock",
              "Run 24/7 across time zones and languages to qualify intent, disqualify low-fit prospects, and move the right buyers to a meeting, trial, or rep handoff with full context attached."
            ],
            [
              "Learn from every conversation, automatically",
              "Every buyer interaction generates signal: which demos resonate, what questions come up most, where buyers drop off, and what content drives conversion."
            ]
          ].map(([title, description], index) => (
            <article key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
        <div className="marketing-ai-agents-setup-insights">
          <div>
            <strong>Knowledge Sources</strong>
            <span>
              ● Interactive Demos <em>26</em>
            </span>
            <span>
              ● PDF Documents <em>13</em>
            </span>
            <span>
              ● Website Pages <em>42</em>
            </span>
            <span>
              ● Case Studies <em>9</em>
            </span>
          </div>
          <div>
            <strong>Guardrails &amp; Rules</strong>
            <span>
              Off-limits topics <em>Hard rule</em>
            </span>
            <span>
              Escalation triggers <em>Hard rule</em>
            </span>
            <span>
              Approved responses <em>Soft rule</em>
            </span>
          </div>
        </div>
      </section>
      <section
        className="marketing-ai-agents-guardrails"
        aria-labelledby="marketing-ai-agents-guardrails-title"
      >
        <div className="marketing-ai-agents-section-heading">
          <p className="marketing-announcement">Designed for trust</p>
          <h2 id="marketing-ai-agents-guardrails-title">
            Guardrails that keep every answer on brand
          </h2>
        </div>
        <div className="marketing-ai-agents-guardrails-grid">
          {[
            "Approved sources",
            "Voice and text",
            "Rep summaries",
            "Intent signals",
            "Visual responses",
            "Workspace controls"
          ].map((item, index) => (
            <article key={item}>
              <span>0{index + 1}</span>
              <h3>{item}</h3>
              <p>
                Keep the response useful, bounded, and connected to the product truth your team
                approves.
              </p>
            </article>
          ))}
        </div>
      </section>
      <section
        className="marketing-ai-agents-teams"
        aria-labelledby="marketing-ai-agents-teams-title"
      >
        <div className="marketing-ai-agents-section-heading">
          <p className="marketing-announcement">ROI ACROSS THE ENTERPRISE</p>
          <h2 id="marketing-ai-agents-teams-title">
            Built for teams that need to qualify and educate at scale
          </h2>
        </div>
        <div className="marketing-ai-agents-metrics" aria-label="AI Demo Agent results">
          <div>
            <strong>
              30<small>%</small>
            </strong>
            <span>Fewer unqualified sales calls</span>
          </div>
          <div>
            <strong>
              6<small>days</small>
            </strong>
            <span>Average setup time to go live</span>
          </div>
          <div>
            <strong>
              3<small>x</small>
            </strong>
            <span>More buyers arrive at &apos;aha&apos; moment</span>
          </div>
        </div>
        <div className="marketing-ai-agents-teams-grid">
          {[
            [
              "Sales and SDR teams",
              "Qualify inbound buyers faster and move the right accounts to a meeting or next step, without waiting on rep availability."
            ],
            [
              "Solutions engineers and presales",
              "Offload repetitive technical walkthroughs while keeping the live demo focused on high-value discussion."
            ],
            [
              "PLG and growth teams",
              "Give high-intent prospects a self-serve path to understand fit and experience the product before they talk to sales."
            ]
          ].map(([title, description], index) => (
            <article key={title}>
              <span>0{index + 1}</span>
              <h3>{title}</h3>
              <p>{description}</p>
              <a href="/use-cases">Explore the use case →</a>
            </article>
          ))}
        </div>
      </section>
      <section
        className="marketing-ai-agents-compare"
        aria-labelledby="marketing-ai-agents-compare-title"
      >
        <div className="marketing-ai-agents-section-heading">
          <p className="marketing-announcement">WHY IT&apos;S DIFFERENT</p>
          <h2 id="marketing-ai-agents-compare-title">
            Your current demo flow vs. the AI Demo Agent
          </h2>
          <p>
            See how the AI Demo Agent transforms every part of the buyer journey, from first touch
            to qualified meeting.
          </p>
        </div>
        <div className="marketing-ai-agents-compare-grid">
          <table>
            <thead>
              <tr>
                <th />
                <th>Today (without Supademo)</th>
                <th>With AI Demo Agent</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Discovery",
                  "Buyer fills out a form and waits for a rep to call back",
                  "Buyer gets answers and sees the product instantly"
                ],
                [
                  "Product access",
                  "Gated behind a scheduled call or generic recording",
                  "Interactive demos surfaced based on what the buyer actually asks"
                ],
                [
                  "Availability",
                  "Limited to rep working hours and capacity",
                  "24/7 across every timezone, in 50+ languages"
                ],
                [
                  "Qualification",
                  "Rep manually qualifies on a 30-min call",
                  "Agent qualifies in real time, before the call happens"
                ],
                [
                  "Content delivery",
                  "Buyer gets a generic PDF or follow-up email",
                  "Agent surfaces the most relevant asset for that buyer's use case"
                ],
                [
                  "Rep handoff",
                  "Rep starts cold with a name and email from a form",
                  "Rep gets a conversation summary, topics discussed, fit score, and assets viewed"
                ],
                [
                  "Intelligence",
                  "Insights trapped in individual rep notes or lost entirely",
                  "Every conversation generates structured data and conversion patterns"
                ]
              ].map(([label, withoutSupademo, withAgent]) => (
                <tr key={label}>
                  <th scope="row">{label}</th>
                  <td>
                    <span aria-hidden="true">×</span>
                    {withoutSupademo}
                  </td>
                  <td>
                    <span aria-hidden="true">✓</span>
                    {withAgent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="marketing-ai-agents-compare-cta">
          <p>Stop losing deals to slow follow-ups and gated demos.</p>
          <a className="marketing-button" href="/product-demo">
            Book a demo <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>
      <section className="marketing-ai-agents-faq" aria-labelledby="marketing-ai-agents-faq-title">
        <div className="marketing-ai-agents-faq-layout">
          <div className="marketing-ai-agents-faq-copy">
            <p className="marketing-announcement">Questions, answered</p>
            <h2 id="marketing-ai-agents-faq-title">FAQs about AI Demo Agents</h2>
            <p>What teams ask before deploying an AI Demo Agent on their site.</p>
            <img
              src="https://supademo.com/images/faq-section-illustration.avif"
              alt="FAQ illustration"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="marketing-ai-agents-faq-list">
            {[
              [
                "What is an AI Demo Agent?",
                "An AI Demo Agent gives every buyer a guided product walkthrough before they speak to sales. Supademo's AI Demo Agent runs discovery, qualifies the buyer, and surfaces the right interactive demos, videos, and decks in real time. It runs 24/7 in any language, learns from every conversation, and hands qualified buyers to sales with full context attached."
              ],
              [
                "How is an AI Demo Agent different from a chatbot?",
                "Chatbots respond with text. Supademo's AI Demo Agent runs structured discovery, plays the right interactive demo, surfaces relevant decks or case studies, and routes qualified buyers to sales with full context attached."
              ],
              [
                "How does the AI agent know what to say?",
                "The AI Demo Agent is trained on approved sources you control: interactive demos, decks, pricing, case studies, and docs. You set guardrails for off-limits topics, escalation triggers, and approved responses."
              ],
              [
                "Can the AI Demo Agent talk to buyers via voice?",
                "Yes. AI Demo Agents support both voice and text in 50+ languages, so buyers interact however they prefer while still surfacing interactive demos and visual proof in real time."
              ],
              [
                "Will the AI Demo Agent replace my sales team?",
                "No. It replaces the dead space before and after the sales conversation, not the sales team. Reps spend less time on basics and more time on deal strategy and relationships."
              ],
              [
                "How long does it take to set up an AI Demo Agent?",
                "Most teams go live in days, not weeks. Connect your demos and collateral, set guardrails, deploy the agent, and let it learn from real conversations."
              ],
              [
                "Is the AI Demo Agent secure for enterprise use?",
                "Yes. AI Demo Agents run within Supademo's SOC 2 Type II framework with AES-256 encryption at rest and TLS in transit. Customer data is never used to train AI models."
              ],
              [
                "Which Supademo plans include AI Demo Agents?",
                "AI Demo Agents are an add-on, available with the Growth and Enterprise plans only. See our pricing page for the full comparison."
              ]
            ].map(([question, answer], index) => (
              <details key={question} open={index === 0}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      {demoOpen ? (
        <div className="marketing-ai-agents-dialog-backdrop" role="presentation">
          <section
            className="marketing-ai-agents-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="marketing-ai-agents-dialog-title"
          >
            <button
              className="marketing-ai-agents-dialog-close"
              type="button"
              onClick={() => setDemoOpen(false)}
              aria-label="Close instant AI demo"
            >
              ×
            </button>
            <p className="marketing-announcement">Instant AI demo</p>
            <h2 id="marketing-ai-agents-dialog-title">See how an agent guides the next step.</h2>
            <p>Start with a sample buyer question and explore a safe preview of the agent flow.</p>
            <a className="marketing-button" href="/signup?source=ai-agent">
              Start the preview
            </a>
          </section>
        </div>
      ) : null}
      <MarketingFooter variant="showcase" />
    </main>
  );
}
