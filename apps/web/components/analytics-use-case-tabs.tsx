"use client";

import { useState } from "react";

const analyticsUseCases = [
  [
    "Sales & Enablement",
    "Qualify and close deals faster",
    "Close more deals by pre-qualifying prospects and involving decision makers through interactive product demos.",
    "/use-cases/sales-enablement",
    "https://supademo.com/images/usecase-sales.avif"
  ],
  [
    "Marketing & Growth",
    "Convert interest into action",
    "Show the value of your product before a call with interactive experiences that make every campaign click count.",
    "/use-cases/product-marketing",
    "https://supademo.com/images/usecase-marketing.avif"
  ],
  [
    "Customer Success",
    "Guide customers to value",
    "Give customers a self-serve path to the feature, workflow, or answer they need next.",
    "/use-cases/customer-success",
    "https://supademo.com/images/usecase-customer-success.avif"
  ],
  [
    "Onboarding",
    "Make the first session count",
    "Turn product onboarding into an interactive walkthrough that is easy to follow and revisit.",
    "/use-cases/product-onboarding",
    "https://supademo.com/images/usecase-onboarding.avif"
  ],
  [
    "Support",
    "Resolve questions visually",
    "Replace long explanations with a focused, clickable answer that meets users in the product.",
    "/use-cases/customer-support",
    "https://supademo.com/images/usecase-support.avif"
  ],
  [
    "Product",
    "Share the product story early",
    "Help stakeholders understand new workflows while the product is still taking shape.",
    "/use-cases/product",
    "https://supademo.com/images/usecase-product.avif"
  ],
  [
    "Training",
    "Teach workflows by doing",
    "Create repeatable learning paths that help every teammate practice the product, not just watch it.",
    "/use-cases/education-training",
    "https://supademo.com/images/usecase-training.avif"
  ]
] as const;

export function AnalyticsUseCaseTabs() {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = analyticsUseCases[activeIndex];

  return (
    <div className="analytics-use-case-tabs">
      <div className="analytics-use-case-tab-list" role="tablist" aria-label="Analytics use cases">
        {analyticsUseCases.map(([label], index) => (
          <button
            className={activeIndex === index ? "is-active" : undefined}
            key={label}
            type="button"
            role="tab"
            aria-selected={activeIndex === index}
            aria-controls={`analytics-use-case-panel-${index}`}
            onClick={() => setActiveIndex(index)}
          >
            {label}
          </button>
        ))}
      </div>
      <article
        className="analytics-use-case-panel"
        id={`analytics-use-case-panel-${activeIndex}`}
        role="tabpanel"
        aria-live="polite"
      >
        <div className="analytics-use-case-copy">
          <h3>{active[1]}</h3>
          <p>{active[2]}</p>
          <a href={active[3]}>
            Supademo for {active[0]} <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="analytics-use-case-media">
          <img src={active[4]} alt={active[1]} loading="lazy" referrerPolicy="no-referrer" />
        </div>
      </article>
    </div>
  );
}
