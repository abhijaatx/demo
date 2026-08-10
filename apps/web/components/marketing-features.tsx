"use client";

import { useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const trustCategories = {
  Software: [
    ["beehiiv", "https://supademo.com/logos/beehiiv.avif"],
    ["Jotform", "https://supademo.com/logos/jotform.svg"],
    ["Typeform", "https://supademo.com/logos/typeform.svg"],
    ["easy", "https://supademo.com/logos/easy.svg"],
    ["Engine", "https://supademo.com/logos/engine.svg"],
    ["Tealium", "https://supademo.com/logos/tealium.svg"],
    ["Bullhorn", "https://supademo.com/logos/bullhorn.svg"],
    ["UserTesting", "https://supademo.com/logos/usertesting.svg"],
    ["RB2B", "https://supademo.com/logos/rb2b.svg"],
    ["Lightspeed", "https://supademo.com/logos/lightspeed.svg"],
    ["Spare", "https://supademo.com/logos/spare.svg"],
    ["DBmaestro", "https://supademo.com/logos/dbmaestro.avif"],
    ["ProcessMaker", "https://supademo.com/logos/processmaker.svg"],
    ["Textable", "https://supademo.com/logos/textable.avif"],
    ["Lucidworks", "https://supademo.com/logos/lucidworks.svg"],
    ["Zilliz", "https://supademo.com/logos/zilliz.svg"],
    ["BambooHR", "https://supademo.com/logos/bamboohr.svg"],
    ["NetApp", "https://supademo.com/logos/netapp.svg"],
    ["Tennr", "https://supademo.com/logos/tennr.svg"],
    ["Plaid", "https://supademo.com/logos/plaid.svg"]
  ],
  Healthcare: [
    ["ReelDX", "https://supademo.com/logos/reeldx.svg"],
    ["Teladoc Health", "https://supademo.com/logos/teladoc.svg"],
    ["PicnicHealth", "https://supademo.com/logos/picnichealth.svg"],
    ["DrChrono", "https://supademo.com/logos/drchrono.svg"],
    ["Opentrons", "https://supademo.com/logos/opentrons.svg"],
    ["Carasent", "https://supademo.com/logos/carasent.svg"],
    ["Cylinder Health", "https://supademo.com/logos/cylinderhealth.svg"],
    ["RetinaAI", "https://supademo.com/logos/retinai.svg"],
    ["Tennr", "https://supademo.com/logos/tennr.svg"],
    ["CVS Health", "https://supademo.com/logos/cvshealth.svg"],
    ["Mindbody", "https://supademo.com/logos/mindbody.svg"],
    ["NexHealth", "https://supademo.com/logos/nexhealth.svg"],
    ["Everhealth", "https://supademo.com/logos/everhealth.svg"],
    ["Solv", "https://supademo.com/logos/solv.svg"],
    ["Nordhealth", "https://supademo.com/logos/nordhealth.svg"],
    ["Medecision", "https://supademo.com/logos/medecision.svg"],
    ["ShiftCare", "https://supademo.com/logos/shiftcare.svg"],
    ["ScreenPoint Medical", "https://supademo.com/logos/screenpointmedical.svg"],
    ["Playback Health", "https://supademo.com/logos/playbackhealth.svg"],
    ["CardMedic", "https://supademo.com/logos/cardmedic.svg"]
  ],
  Enterprise: [
    ["SIEMENS", "https://supademo.com/logos/simens.svg"],
    ["Hewlett Packard Enterprise", "https://supademo.com/logos/hpe.svg"],
    ["Pokémon", "https://supademo.com/logos/pokemon.svg"],
    ["Agilysys", "https://supademo.com/logos/agilysys.svg"],
    ["Bold Penguin", "https://supademo.com/logos/boldpenguin.svg"],
    ["Singapore Government", "https://supademo.com/logos/singapore-gov.svg"],
    ["Plaid", "https://supademo.com/logos/plaid.svg"],
    ["Equitable", "https://supademo.com/logos/equitable.svg"],
    ["CBRE", "https://supademo.com/logos/cbre.svg"],
    ["WeWork", "https://supademo.com/logos/wework.svg"],
    ["NetApp", "https://supademo.com/logos/netapp.svg"],
    ["DHL", "https://supademo.com/logos/dhl.svg"],
    ["Maersk", "https://supademo.com/logos/maersk.svg"],
    ["Emerson", "https://supademo.com/logos/emerson.svg"],
    ["HubSpot", "https://supademo.com/logos/hubspot.svg"],
    ["Help Scout", "https://supademo.com/logos/helpscout.svg"],
    ["Lightspeed", "https://supademo.com/logos/lightspeed.svg"],
    ["Spare", "https://supademo.com/logos/spare.svg"],
    ["VRIFY", "https://supademo.com/logos/vrify.svg"],
    ["Alibaba", "https://supademo.com/logos/alibaba.svg"]
  ],
  "Government & Non-Profit": [
    ["Singapore Government", "https://supademo.com/logos/singapore-gov.svg"],
    ["UNOPS", "https://supademo.com/logos/unops.svg"],
    ["Alzheimer's Association", "https://supademo.com/logos/alzheimers.svg"],
    ["American Red Cross", "https://supademo.com/logos/redcross.svg"],
    ["C3.ai", "https://supademo.com/logos/c3ai.svg"],
    ["Lucidworks", "https://supademo.com/logos/lucidworks.svg"],
    ["ProcessMaker", "https://supademo.com/logos/processmaker.svg"],
    ["Databox", "https://supademo.com/logos/databox.svg"],
    ["Tennr", "https://supademo.com/logos/tennr.svg"],
    ["Opentrons", "https://supademo.com/logos/opentrons.svg"],
    ["Plaid", "https://supademo.com/logos/plaid.svg"],
    ["Tealium", "https://supademo.com/logos/tealium.svg"],
    ["Hewlett Packard Enterprise", "https://supademo.com/logos/hpe.svg"],
    ["DHL", "https://supademo.com/logos/dhl.svg"],
    ["NetApp", "https://supademo.com/logos/netapp.svg"],
    ["Maersk", "https://supademo.com/logos/maersk.svg"],
    ["Emerson", "https://supademo.com/logos/emerson.svg"],
    ["CBRE", "https://supademo.com/logos/cbre.svg"],
    ["WeWork", "https://supademo.com/logos/wework.svg"],
    ["HubSpot", "https://supademo.com/logos/hubspot.svg"]
  ]
} as const;

type TrustCategory = keyof typeof trustCategories;

const featureCarouselCards = [
  [
    "Record Interactive Demos",
    "Record demos in HTML, screenshot, video or in multi-demo formats.",
    "https://supademo.com/images/scale-01.avif"
  ],
  [
    "Advanced Analytics",
    "Get deep insights into dropoff rates, conversion, engagement, and viewers.",
    "https://supademo.com/images/scale-02.avif"
  ],
  [
    "Team Workspaces",
    "Asynchronously share, organize, and collaborate on Supademos as a team.",
    "https://supademo.com/images/scale-03.avif"
  ],
  [
    "Trigger as In-App Tour",
    "Programmatically trigger in-app tours to better onboard and guide your users.",
    "https://supademo.com/images/scale-04.avif"
  ],
  [
    "Auto-Translation",
    "Translate your product demos instantly in 15+ languages with the power of AI.",
    "https://supademo.com/images/scale-05.avif"
  ],
  [
    "AI Voiceovers",
    "Elevate demos with AI voice narration for enhanced and better user engagement.",
    "https://supademo.com/images/scale-06.avif"
  ],
  [
    "Guided HTML Demos",
    "Create guided demos by cloning and replicating your product in HTML.",
    "https://supademo.com/images/scale-07.avif"
  ],
  [
    "Sandbox Demos",
    "Build free-exploration environments that fully emulate your product experience.",
    "https://supademo.com/images/scale-09.avif"
  ]
] as const;

const audiences = [
  ["Sales & Enablement", "Leave behind the right next step for every buyer."],
  ["Marketing & Growth", "Make the aha moment easier to reach."],
  ["Customer Success", "Turn repeated explanations into useful guides."],
  ["Onboarding", "Help new users get moving without a meeting."],
  ["Support", "Show the fix instead of describing it."],
  ["Product", "Make new workflows easier to understand."],
  ["Training", "Teach the task at the moment it matters."]
] as const;

const recordCards = [
  [
    "Web Apps",
    "Use the extension to record HTML, screenshot or video-based interactive demos of any website.",
    "https://supademo.com/features/record-feature-1.avif",
    "Web app recording extension"
  ],
  [
    "Desktop Apps",
    "Use the Desktop app to record any desktop app process.",
    "https://supademo.com/features/record-feature-2.avif",
    "Desktop app recording"
  ],
  [
    "Mobile Apps",
    "Upload screenshots from your mobile and tablet devices.",
    "https://supademo.com/features/record-feature-3.avif",
    "Mobile app screenshots"
  ]
] as const;

function FeatureDetailSections() {
  return (
    <div className="features-detail-sections">
      <section className="features-detail-record" aria-labelledby="features-record-title">
        <div className="features-detail-inner">
          <p className="features-detail-kicker">Screen Recording</p>
          <h2 id="features-record-title">Record any product or workflow</h2>
          <p className="features-detail-lead">
            Say goodbye to video scripts, re-recording, or manual screenshots with no context.
            Supademo transforms any product flow into an engaging interactive demo.
          </p>
          <div className="features-record-grid">
            {recordCards.map(([title, description, image, alt]) => (
              <article key={title}>
                <img src={image} alt={alt} loading="lazy" referrerPolicy="no-referrer" />
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="features-detail-editing" aria-labelledby="features-editing-title">
        <div className="features-detail-inner">
          <p className="features-detail-kicker">Editing</p>
          <h2 id="features-editing-title">Intuitive, user-friendly editing</h2>
          <p className="features-detail-lead">
            Add, edit or replace hotspots and screens through an easy-to-use editor.
          </p>
          <div className="features-editing-grid">
            <article>
              <div>
                <h3>Personalize Hotspots</h3>
                <p>
                  Add multiple hotspots, format text, and customize the design of your hotspots.
                </p>
              </div>
              <img
                src="https://supademo.com/features/features-edit-1.avif"
                alt="Personalize hotspots"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </article>
            <article>
              <div>
                <h3>Blur, Crop and Annotate</h3>
                <p>
                  Easily redact any sensitive information directly within the editor. Crop slides or
                  highlight areas with callouts.
                </p>
              </div>
              <img
                src="https://supademo.com/features/features-edit-2.avif"
                alt="Blur crop and annotate"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </article>
          </div>
          <article className="features-branding-card">
            <div>
              <h3>Upload Company Branding</h3>
              <p>
                Add a professional touch by adding your custom domain, logo, brand colors, and more.
              </p>
            </div>
            <img
              src="https://supademo.com/images/example1.avif"
              alt="Company branding controls"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </article>
        </div>
      </section>

      <section
        className="features-detail-personalization"
        aria-labelledby="features-personalization-title"
      >
        <div className="features-detail-inner">
          <p className="features-detail-kicker">Personalization</p>
          <h2 id="features-personalization-title">Enhance with advanced features</h2>
          <p className="features-detail-lead">
            Drive engagement and adoption with beautifully interactive, personalized Supademos.
          </p>
          <div className="features-personalization-grid">
            {[
              [
                "AI Voiceover and Text",
                "Overlay synthetic, AI-powered voices to any Supademo. Leverage Gen AI to rewrite text hotspots based on prompt and context.",
                "https://supademo.com/images/ai-feature-1.avif"
              ],
              [
                "Zoom and Pan",
                "Enable viewers to zoom into specific areas on the screen to narrow their focus.",
                "https://supademo.com/images/zoom-feature-1.avif"
              ],
              [
                "Multi-demo Showcases",
                "Showcase complex features by grouping multiple Supademos into a single link.",
                "https://supademo.com/images/showcase-feature-1.avif"
              ],
              [
                "Autoplay",
                "Loop through slides without user interaction for added views and engagement.",
                "https://supademo.com/images/autoplay-feature-1.avif"
              ],
              [
                "Dynamic Variables",
                "Dynamically personalize your Supademo for each viewer in sequences or onboarding.",
                "https://supademo.com/images/variables-feature-1.avif"
              ],
              [
                "Gated Demos",
                "Capture email leads or limit demo access using passwords.",
                "https://supademo.com/images/gate-feature-1.avif"
              ],
              [
                "Conditional Branching",
                "Allow viewers to choose their own journey with multi-flow chapters or custom hotspot targets.",
                "https://supademo.com/images/branch-feature-1.avif"
              ]
            ].map(([title, description, image]) => (
              <article key={title}>
                <div>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <img
                  src={image}
                  alt={`${title} feature`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="features-detail-sharing" aria-labelledby="features-sharing-title">
        <div className="features-detail-inner">
          <p className="features-detail-kicker">Sharing</p>
          <h2 id="features-sharing-title">Share with anyone, anywhere</h2>
          <p className="features-detail-lead">
            Whether you want to email Supademo to a prospect, embed in your help center, or share as
            an onboarding playbook, we’ve got you covered.
          </p>
          <img
            src="https://supademo.com/integrations/integrations-min.avif"
            alt="Supademo share options"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      <section
        className="features-detail-collaboration"
        aria-labelledby="features-collaboration-title"
      >
        <div className="features-detail-inner features-detail-split">
          <div>
            <p className="features-detail-kicker">Collaboration</p>
            <h2 id="features-collaboration-title">Comment directly on the Supademo editor</h2>
            <p className="features-detail-lead">
              Add comments, emoji reactions, create and link to specific threads, or resolve issues
              directly through the Supademo editor.
            </p>
          </div>
          <img
            src="https://supademo.com/features/comment-feature.avif"
            alt="Comment feature"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      <section className="features-detail-analytics" aria-labelledby="features-analytics-title">
        <div className="features-detail-inner features-detail-split">
          <img
            src="https://supademo.com/features/analytics-feature-1.avif"
            alt="Analytics feature"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div>
            <p className="features-detail-kicker">Analytics</p>
            <h2 id="features-analytics-title">See who views and completes your Supademo</h2>
            <p className="features-detail-lead">
              Improve the performance of your Supademo by tracking viewers, engagement, and
              completion rates by demo and time-period.
            </p>
          </div>
        </div>
      </section>

      <section className="features-detail-explore" aria-labelledby="features-explore-title">
        <div className="features-detail-inner">
          <h2 id="features-explore-title">Explore More Features</h2>
          <div className="features-explore-grid">
            {[
              "Demo Recorder",
              "Guided HTML Demo",
              "Sandbox Demos",
              "Screen Recorder",
              "Screenshot",
              "Demo Editor",
              "Personalization",
              "AI Voiceover"
            ].map((label) => (
              <a key={label} href="/features">
                {label}
                <span aria-hidden="true">→</span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export function MarketingFeatures() {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeAudience, setActiveAudience] = useState(0);
  const [embedFailed, setEmbedFailed] = useState(false);
  const [trustCategory, setTrustCategory] = useState<TrustCategory>("Software");
  const [trustMenuOpen, setTrustMenuOpen] = useState(false);
  const maxCarouselIndex = featureCarouselCards.length - 3;

  return (
    <main className="features-page" id="main">
      <MarketingHeader variant="sharing" />
      <section className="features-hero" aria-labelledby="features-title">
        <div className="features-hero-glow" aria-hidden="true" />
        <p className="features-eyebrow">Everything you need to show the product</p>
        <h1 id="features-title">The #1 Demo Automation Platform</h1>
        <p>
          Rated one of G2&apos;s Top 50 Sales Products and the #5 Fastest Growing Product in 2025.
          Explore the features teams love most.
        </p>
        <div className="features-hero-actions">
          <a className="marketing-button" href="/signup">
            Start for free →
          </a>
        </div>
      </section>

      <section className="features-preview" aria-label="Demo automation preview">
        <div className="features-hero-frame" aria-label="Demo automation preview" role="img">
          <div className="features-hero-frame-bar" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <iframe
            className="features-hero-frame-embed"
            title="Screenshot & Video Demo"
            src="https://app.supademo.com/embed/cmewzomb200ci0m0jgnfi4xgm"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
            referrerPolicy="no-referrer"
            onLoad={() => setEmbedFailed(false)}
            onError={() => setEmbedFailed(true)}
          />
          <div
            className={`features-hero-frame-placeholder${embedFailed ? "" : " is-hidden"}`}
            aria-hidden="true"
          >
            <strong>Build a demo your audience can finish.</strong>
            <span />
            <span />
            <span />
          </div>
        </div>
      </section>

      <section className="features-trust" aria-labelledby="features-trust-title">
        <div className="features-trust-inner">
          <div className="features-trust-heading">
            <h2 id="features-trust-title">
              Trusted by 200,000+ top operators and 3,000+ paying organizations
            </h2>
            <div className="features-trust-ratings" aria-label="Supademo ratings and awards">
              <img
                src="https://supademo.com/images/supademo-rating-03.webp"
                alt="Awards and trust badges from G2 and Google"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
              <img
                src="https://supademo.com/images/supademo-rating-02.webp"
                alt="Additional Supademo ratings and awards"
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <fieldset className="features-trust-logo-panel">
            <legend>
              <span>Explore</span>
              <span className="features-trust-selector">
                <button
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={trustMenuOpen}
                  aria-controls="features-trust-category-options"
                  onClick={() => setTrustMenuOpen((open) => !open)}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") {
                      setTrustMenuOpen(false);
                    }
                    if (event.key === "ArrowDown") {
                      setTrustMenuOpen(true);
                    }
                  }}
                >
                  <span>{trustCategory}</span>
                  <span className="features-trust-chevron" aria-hidden="true" />
                </button>
                {trustMenuOpen ? (
                  <span
                    id="features-trust-category-options"
                    className="features-trust-menu"
                    role="listbox"
                    aria-label="Trust categories"
                  >
                    {(Object.keys(trustCategories) as TrustCategory[]).map((category) => (
                      <button
                        type="button"
                        role="option"
                        key={category}
                        aria-selected={category === trustCategory}
                        onClick={() => {
                          setTrustCategory(category);
                          setTrustMenuOpen(false);
                        }}
                      >
                        {category}
                      </button>
                    ))}
                  </span>
                ) : null}
              </span>
              <span>companies that trust Supademo</span>
            </legend>
            <div className="features-trust-logo-grid" key={trustCategory} aria-live="polite">
              {trustCategories[trustCategory].map(([name, src]) => (
                <div className="features-trust-logo" key={`${trustCategory}-${name}`}>
                  <img
                    src={src}
                    alt={`${name} logo`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      <section className="features-modes" id="feature-modes" aria-labelledby="features-modes-title">
        <div className="features-modes-inner">
          <div className="features-modes-heading">
            <h2 id="features-modes-title">Scale how your team demonstrates products</h2>
            <p>
              Drive conversions by personalizing your product demo with dynamic variables,
              conditional branching, custom branding and demo chapters.
            </p>
          </div>
          <div className="features-carousel-viewport" aria-live="polite">
            <div
              className="features-carousel-track"
              style={{ transform: `translateX(-${activeFeature * 376}px)` }}
            >
              {featureCarouselCards.map(([title, description, image]) => (
                <article className="features-carousel-card" key={title}>
                  <div className="features-carousel-media">
                    <img src={image} alt={title} loading="lazy" referrerPolicy="no-referrer" />
                  </div>
                  <div className="features-carousel-copy">
                    <h3>{title}</h3>
                    <p>{description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <div className="features-carousel-tabs" role="tablist" aria-label="Feature highlights">
            {featureCarouselCards.map(([title], index) => (
              <button
                type="button"
                role="tab"
                key={title}
                aria-selected={index === activeFeature}
                onClick={() => setActiveFeature(Math.min(index, maxCarouselIndex))}
              >
                {title}
              </button>
            ))}
          </div>
          <div className="features-carousel-controls">
            <button
              type="button"
              aria-label="Previous"
              disabled={activeFeature === 0}
              onClick={() => setActiveFeature((index) => Math.max(0, index - 1))}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Next"
              disabled={activeFeature >= maxCarouselIndex}
              onClick={() => setActiveFeature((index) => Math.min(maxCarouselIndex, index + 1))}
            >
              →
            </button>
          </div>
        </div>
      </section>

      <section className="features-audiences" aria-labelledby="features-audience-title">
        <div className="features-section-heading compact">
          <p className="features-eyebrow">Built around the work</p>
          <h2 id="features-audience-title">Powerful uses cases for every team at your company</h2>
        </div>
        <div className="features-audience-layout">
          <div className="features-audience-list" role="tablist" aria-label="Team use cases">
            {audiences.map(([label], index) => (
              <button
                type="button"
                role="tab"
                key={label}
                aria-selected={index === activeAudience}
                onClick={() => setActiveAudience(index)}
              >
                <span>{label}</span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
          </div>
          <article className="features-audience-card" aria-live="polite">
            <span className="features-audience-number">0{activeAudience + 1}</span>
            <h3>{audiences[activeAudience][0]}</h3>
            <p>{audiences[activeAudience][1]}</p>
            <a href="/signup" className="marketing-button">
              Start a demo →
            </a>
          </article>
        </div>
      </section>

      <FeatureDetailSections />
      <MarketingFooter variant="showcase" />
    </main>
  );
}
