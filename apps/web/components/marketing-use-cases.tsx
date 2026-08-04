"use client";

import { useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const useCaseModes = [
  {
    label: "Sales & Enablement",
    title: "Close more deals",
    description:
      "Close more deals by pre-qualifying prospects and involving decision makers through interactive product demos.",
    href: "/use-cases/sales-enablement",
    linkLabel: "Supademo for Sales & Enablement",
    image: "https://supademo.com/images/usecase-sales.avif",
    imageAlt: "Interactive sales product demo"
  },
  {
    label: "Marketing & Growth",
    title: "Scale product-led marketing",
    description:
      "Demonstrate product value propositions through interactive visualization rather than static content, without requiring subscriptions or paywalls.",
    href: "/use-cases/product-marketing",
    linkLabel: "Supademo for Marketing",
    image: "https://supademo.com/images/usecase-marketing.avif",
    imageAlt: "Interactive marketing product demo"
  },
  {
    label: "Customer Success",
    title: "Turn customers into champions",
    description:
      "Enable CS teams to proactively guide customers, drive deeper adoption, and celebrate wins using interactive demos that educate and inspire at scale.",
    href: "/use-cases/customer-success",
    linkLabel: "Supademo for Customer Success",
    image: "https://supademo.com/images/usecase-customer-success.avif",
    imageAlt: "Interactive customer success product demo"
  },
  {
    label: "Onboarding",
    title: "Accelerate time-to-value",
    description:
      "Modernize customer onboarding with guided interactive demos that teach key features, shorten learning curves, and accelerate product adoption.",
    href: "/use-cases/product-onboarding",
    linkLabel: "Supademo for Onboarding",
    image: "https://supademo.com/images/usecase-onboarding.avif",
    imageAlt: "Interactive onboarding product demo"
  },
  {
    label: "Support",
    title: "Reduce support burden at scale",
    description:
      "Minimize support tickets and speed resolution by providing interactive walkthroughs and tutorials that deliver immediate answers when customers need them.",
    href: "/use-cases/customer-support",
    linkLabel: "Supademo for Customer Support",
    image: "https://supademo.com/images/usecase-support.avif",
    imageAlt: "Interactive customer support product demo"
  },
  {
    label: "Product",
    title: "Test products & iterate faster",
    description:
      "Leverage interactive demos as prototypes to validate new features, gather early feedback, and refine experiences before development begins.",
    href: "/use-cases/product",
    linkLabel: "Supademo for Product",
    image: "https://supademo.com/images/usecase-product.avif",
    imageAlt: "Interactive product demo prototype"
  },
  {
    label: "Training",
    title: "Scale internal training",
    description:
      "Empower employees to self-directed learning through asynchronous guides embedded in documentation, manuals, and learning platforms.",
    href: "/use-cases/education-training",
    linkLabel: "Supademo for Training & Education",
    image: "https://supademo.com/images/usecase-training.avif",
    imageAlt: "Interactive training product demo"
  }
] as const;

const useCaseCards = [
  {
    title: "Align teams on feature updates",
    description:
      "Build a shared best practice of the latest features, product updates, and interactive content for sharing externally.",
    kind: "updates"
  },
  {
    title: "Shareable demos for champions",
    description:
      "Loop in decision makers with shareable Supademos to recap key benefits and features discussed in a sales demo.",
    kind: "champions"
  },
  {
    title: "Reduce redundant support",
    description:
      "Create intuitive, click-through demos to replace resource-intensive screen sharing sessions and support chats.",
    kind: "support"
  },
  {
    title: "Scale self-serve guidance",
    description:
      "Embed Supademos throughout support docs, product guides and onboarding to reduce support tickets.",
    kind: "guidance"
  },
  {
    title: "Drive top-of-funnel MQLs",
    description:
      "Replace static assets and heavy video with playful, self-paced interactive demos that drive engagement.",
    kind: "mqls"
  },
  {
    title: "Accelerate onboarding",
    description:
      "Shorten your customer's time-to-value with intuitive onboarding that drives learning by doing.",
    kind: "onboarding"
  }
] as const;

const featureSlides = [
  [
    [
      "Built-in email capture and surveys",
      "Capture leads and collect valuable viewer feedback with built-in email forms and custom surveys."
    ],
    [
      "Add voiceovers and translations",
      "Bring demos to life with AI-generated voiceovers and instantly translate into 15+ languages."
    ],
    [
      "Add chapters and CTAs",
      "Organize demos with chapters and drive action with customizable CTAs to any external link or demo step."
    ]
  ],
  [
    [
      "Trigger as In-App Tour",
      "Embed interactive tours directly in your app to guide users through key features and workflows."
    ],
    [
      "Auto-Translation",
      "Instantly translate your product demos into 15+ languages to reach global audiences effortlessly."
    ],
    [
      "AI Voiceovers",
      "Add professional AI-generated voice narration to enhance engagement and guide viewers through demos."
    ]
  ]
] as const;

const useCaseCardImages = {
  updates: "https://supademo.com/images/popular-usecase-01.avif",
  champions: "https://supademo.com/images/popular-usecase-02.avif",
  support: "https://supademo.com/images/popular-usecase-03.avif",
  guidance: "https://supademo.com/images/popular-usecase-04.avif",
  mqls: "https://supademo.com/images/popular-usecase-05.avif",
  onboarding: "https://supademo.com/images/popular-usecase-06.avif"
} as const;

const featureImages = [
  [
    "https://supademo.com/images/usecase-feature-01.avif",
    "https://supademo.com/images/usecase-feature-02.avif",
    "https://supademo.com/images/usecase-feature-03.avif"
  ],
  [
    "https://supademo.com/images/usecase-feature-04.avif",
    "https://supademo.com/images/usecase-feature-05.avif",
    "https://supademo.com/images/usecase-feature-06.avif"
  ]
] as const;

const testimonials = [
  [
    "Spare",
    "Supademo has become an invaluable part of various workflows at Spare.",
    "Kristoffer Vik Hansen",
    "Co-founder & CEO"
  ],
  [
    "Beehiiv",
    "We've driven several thousand signups through our demo experience so far.",
    "EJ White",
    "Head of Growth"
  ],
  [
    "VRIFY",
    "Supademo has allowed us to rapidly increase our onboarding and knowledge creation.",
    "Nova Siegmann",
    "Sr. Manager, Product Enablement"
  ]
] as const;

const trustBadges = [
  "https://supademo.com/images/supademo-rating-03.webp",
  "https://supademo.com/images/supademo-rating-02.webp"
] as const;

const trustLogos = [
  [
    ["Spare", "https://supademo.com/logos/spare.svg"],
    ["Jotform", "https://supademo.com/logos/jotform.svg"],
    ["Anvil", "https://supademo.com/logos/anvil.svg"],
    ["Beehiiv", "https://supademo.com/logos/beehiiv.svg"],
    ["Ledger", "https://supademo.com/logos/ledger.svg"],
    ["Visma", "https://supademo.com/logos/visma.svg"],
    ["Lightspeed", "https://supademo.com/logos/lightspeed.svg"],
    ["Eng", "https://supademo.com/logos/eng.svg"],
    ["Relevance AI", "https://supademo.com/logos/relevance-ai.svg"],
    ["Easy", "https://supademo.com/logos/easy.svg"]
  ],
  [
    ["Alibaba", "https://supademo.com/logos/alibaba.avif"],
    ["Bullhorn", "https://supademo.com/logos/bullhorn.svg"],
    ["Typeform", "https://supademo.com/logos/typeform.svg"],
    ["NetApp", "https://supademo.com/logos/netapp.svg"],
    ["B2B", "https://supademo.com/logos/b2b.svg"],
    ["Turo", "https://supademo.com/logos/turo.svg"],
    ["Concentrix", "https://supademo.com/logos/concentrix.svg"],
    ["VRIFY", "https://supademo.com/logos/vrify.svg"],
    ["Posh", "https://supademo.com/logos/posh.svg"],
    ["Siemens", "https://supademo.com/logos/simens.svg"]
  ]
] as const;

function UseCaseCardArt({ kind }: { kind: (typeof useCaseCards)[number]["kind"] }) {
  return (
    <img
      className={`use-cases-card-art use-cases-card-art-${kind}`}
      src={useCaseCardImages[kind]}
      alt=""
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}

export function MarketingUseCases() {
  const [activeUseCase, setActiveUseCase] = useState(1);
  const [featureSlide, setFeatureSlide] = useState(0);
  const [showFeatured, setShowFeatured] = useState(true);
  const activeMode = useCaseModes[activeUseCase];
  const currentFeatures = featureSlides[featureSlide];
  const currentFeatureImages = featureImages[featureSlide];

  return (
    <main className="use-cases-page" id="main">
      <MarketingHeader variant="sharing" />

      <section className="use-cases-hero" aria-labelledby="use-cases-title">
        <div className="use-cases-hero-copy">
          <p className="use-cases-eyebrow">Use cases for every team</p>
          <h1 id="use-cases-title">Tailored use cases for your entire team</h1>
          <p>
            Learn how to leverage Supademo across multiple departments to drive positive outcomes
            across the entire organization.
          </p>
          <div className="use-cases-hero-actions">
            <a className="marketing-button" href="/signup">
              Create your first Supademo <span aria-hidden="true">→</span>
            </a>
            <a className="marketing-button marketing-button-outline" href="/product-demo">
              Request a demo
            </a>
          </div>
        </div>
        <div
          className="use-cases-hero-art"
          aria-label="Interactive product demo preview"
          role="img"
        >
          <img
            className="use-cases-hero-image"
            src="https://supademo.com/images/scale-03.avif"
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
          <div className="use-cases-hero-browser" aria-hidden="true">
            <span />
            <span />
            <span />
            <strong>supademo / team workspace</strong>
          </div>
          <div className="use-cases-hero-screen" aria-hidden="true">
            <aside>
              <i />
              <i />
              <i />
              <i />
            </aside>
            <div>
              <b>Make every workflow easier to show.</b>
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </section>

      <section className="use-cases-featured" aria-labelledby="use-cases-featured-title">
        <div className="use-cases-section-heading">
          <p className="use-cases-eyebrow">One platform, many paths</p>
          <h2 id="use-cases-featured-title">Powerful use cases for every team at your company</h2>
        </div>
        <div className="use-cases-tabs" role="tablist" aria-label="Team use cases">
          {useCaseModes.map((mode, index) => (
            <button
              type="button"
              role="tab"
              key={mode.label}
              aria-selected={index === activeUseCase}
              aria-controls={`use-case-panel-${index}`}
              onClick={() => setActiveUseCase(index)}
            >
              {mode.label}
            </button>
          ))}
        </div>
        <article
          className="use-cases-featured-card"
          id={`use-case-panel-${activeUseCase}`}
          role="tabpanel"
          aria-live="polite"
        >
          <div>
            <span className="use-cases-card-index">0{activeUseCase + 1}</span>
            <h3>{activeMode.title}</h3>
            <p>{activeMode.description}</p>
            <a href={activeMode.href} className="use-cases-inline-link">
              {activeMode.linkLabel} <span aria-hidden="true">→</span>
            </a>
          </div>
          <img
            className="use-cases-featured-image"
            src={activeMode.image}
            alt={activeMode.imageAlt}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        </article>
      </section>

      <section className="use-cases-card-grid" aria-label="Popular use cases">
        {useCaseCards.map((card) => (
          <article className="use-cases-grid-card" key={card.title}>
            <div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
            <UseCaseCardArt kind={card.kind} />
          </article>
        ))}
      </section>

      <section className="use-cases-features" aria-labelledby="use-cases-features-title">
        <img
          className="use-cases-features-illustration"
          src="https://supademo.com/_next/static/media/features-illustration.0x3mde-e47dm2.svg"
          alt=""
          aria-hidden="true"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
        <div className="use-cases-section-heading">
          <p className="use-cases-eyebrow">Built for the moment of explanation</p>
          <h2 id="use-cases-features-title">Features to help you build better demos</h2>
        </div>
        <div className="use-cases-feature-grid" aria-live="polite">
          {currentFeatures.map(([title, description], index) => (
            <article key={title} className="use-cases-feature-card">
              <div className="use-cases-feature-media">
                <img
                  src={currentFeatureImages[index]}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              </div>
              <div className="use-cases-feature-body">
                <div className="use-cases-feature-icon" aria-hidden="true">
                  ✦
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="use-cases-carousel-controls" aria-label="Feature carousel controls">
          <button
            type="button"
            aria-label="Previous"
            disabled={featureSlide === 0}
            onClick={() => setFeatureSlide((current) => Math.max(0, current - 1))}
          >
            ←
          </button>
          <span>
            {featureSlide + 1} / {featureSlides.length}
          </span>
          <button
            type="button"
            aria-label="Next"
            disabled={featureSlide === featureSlides.length - 1}
            onClick={() =>
              setFeatureSlide((current) => Math.min(featureSlides.length - 1, current + 1))
            }
          >
            →
          </button>
        </div>
      </section>

      <section className="use-cases-trust" aria-labelledby="use-cases-trust-title">
        <div className="use-cases-trust-heading">
          <h2 id="use-cases-trust-title">
            Trusted by 200,000+ top operators
            <br />
            and 3,000+ paying organizations
          </h2>
          <div className="use-cases-trust-badges" aria-hidden="true">
            {trustBadges.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ))}
          </div>
        </div>
        <div className="use-cases-testimonial-picker">
          <button
            type="button"
            aria-pressed={showFeatured}
            onClick={() => setShowFeatured((current) => !current)}
          >
            Featured
          </button>
          <span>companies that trust Supademo</span>
        </div>
        {showFeatured ? (
          <div className="use-cases-trust-logos" aria-label="Companies that trust Supademo">
            {trustLogos.map((row, rowIndex) => (
              <div className="use-cases-trust-logo-row" key={rowIndex}>
                {row.map(([label, src]) => (
                  <span className="use-cases-trust-logo" key={label}>
                    <img
                      src={src}
                      alt={label}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                        const fallback = event.currentTarget.nextElementSibling;
                        if (fallback instanceof HTMLElement) fallback.style.display = "block";
                      }}
                    />
                    <b>{label}</b>
                  </span>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div className="use-cases-testimonials" aria-live="polite">
            {testimonials.map(([company, quote, name, role]) => (
              <article key={company} className="use-cases-testimonial-card">
                <strong>{company}</strong>
                <p>“{quote}”</p>
                <span>{name}</span>
                <small>{role}</small>
              </article>
            ))}
          </div>
        )}
      </section>

      <MarketingFooter variant="showcase" />
    </main>
  );
}
