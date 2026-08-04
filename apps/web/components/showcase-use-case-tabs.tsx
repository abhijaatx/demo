"use client";

import { useState } from "react";

const showcaseUseCases = [
  [
    "Sales & Enablement",
    "Qualify and close deals faster",
    "Close more deals by pre-qualifying prospects and involving decision makers through interactive product demos.",
    "/use-cases/sales-enablement",
    "https://supademo.com/images/usecase-sales.avif",
    "Supademo for Sales & Enablement"
  ],
  [
    "Marketing & Growth",
    "Scale product-led marketing",
    "Demonstrate product value propositions through interactive visualization rather than static content, without requiring subscriptions or paywalls.",
    "/use-cases/product-marketing",
    "https://supademo.com/images/usecase-marketing.avif",
    "Supademo for Marketing"
  ],
  [
    "Customer Success",
    "Turn customers into champions",
    "Enable CS teams to proactively guide customers, drive deeper adoption, and celebrate wins using interactive demos that educate and inspire at scale.",
    "/use-cases/customer-success",
    "https://supademo.com/images/usecase-customer-success.avif",
    "Supademo for Customer Success"
  ],
  [
    "Onboarding",
    "Accelerate time-to-value",
    "Modernize customer onboarding with guided interactive demos that teach key features, shorten learning curves, and accelerate product adoption.",
    "/use-cases/product-onboarding",
    "https://supademo.com/images/usecase-onboarding.avif",
    "Supademo for Onboarding"
  ],
  [
    "Support",
    "Reduce support burden at scale",
    "Minimize support tickets and speed resolution by providing interactive walkthroughs and tutorials that deliver immediate answers when customers need them.",
    "/use-cases/customer-support",
    "https://supademo.com/images/usecase-support.avif",
    "Supademo for Customer Support"
  ],
  [
    "Product",
    "Test products & iterate faster",
    "Leverage interactive demos as prototypes to validate new features, gather early feedback, and refine experiences before development begins.",
    "/use-cases/product",
    "https://supademo.com/images/usecase-product.avif",
    "Supademo for Product"
  ],
  [
    "Training",
    "Scale internal training",
    "Empower employees to self-directed learning through asynchronous guides embedded in documentation, manuals, and learning platforms.",
    "/use-cases/education-training",
    "https://supademo.com/images/usecase-training.avif",
    "Supademo for Training & Education"
  ]
] as const;

export function ShowcaseUseCaseTabs() {
  // Supademo opens this page on the onboarding story, which is the most
  // representative showcase example and keeps the first viewport useful.
  const [activeIndex, setActiveIndex] = useState(3);
  const active = showcaseUseCases[activeIndex];

  return (
    <div className="showcase-use-case-tabs">
      <div className="showcase-use-case-tab-list" role="tablist" aria-label="Showcase use cases">
        {showcaseUseCases.map(([label], index) => (
          <button
            className={activeIndex === index ? "is-active" : undefined}
            key={label}
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            aria-controls={`showcase-use-case-panel-${index}`}
            onClick={() => setActiveIndex(index)}
          >
            {label}
          </button>
        ))}
      </div>
      <article
        className="showcase-use-case-panel"
        id={`showcase-use-case-panel-${activeIndex}`}
        role="tabpanel"
        aria-live="polite"
      >
        <div className="showcase-use-case-copy">
          <h3>{active[1]}</h3>
          <p>{active[2]}</p>
          <a href={active[3]}>
            {active[5]} <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="showcase-use-case-media">
          <img src={active[4]} alt={active[1]} loading="lazy" referrerPolicy="no-referrer" />
        </div>
      </article>
    </div>
  );
}
