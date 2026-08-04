"use client";

import { useMemo, useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const customerStories = [
  {
    company: "Bullhorn",
    size: "201-500",
    useCase: "Product Marketing",
    title: "2x faster production, 20% increase in demo engagement",
    detail: "Recuritment Software Platform",
    href: "/customers/bullhorn"
  },
  {
    company: "Lightspeed",
    size: "501-1000",
    useCase: "Sales Enablement",
    title: "60% faster content production, scaling across the enterprise",
    detail: "Enterprise Commerce & POS",
    href: "/customers/lightspeed"
  },
  {
    company: "Easy Software",
    size: "51-200",
    useCase: "Customer Success",
    title: "Closing more sales contracts with demo automation",
    detail: "Enterprise Content Management",
    href: "/customers/easy-software"
  },
  {
    company: "VRIFY",
    size: "51-200",
    useCase: "Sales Enablement",
    title: "Slashing enablement content production time by 75%",
    detail: "Mining & Exploration SaaS",
    href: "/customers/vrify"
  },
  {
    company: "Rev.io",
    size: "1000+",
    useCase: "Training & Education",
    title: "Creating training material in hours instead of weeks with 50% smaller team",
    detail: "Billing & Payments Platform",
    href: "/customers/revio"
  },
  {
    company: "DBmaestro",
    size: "51-200",
    useCase: "Customer Success",
    title: "DBmaestro accelerates demo delivery and enablement by 80%",
    detail: "Database DevOps",
    href: "/customers/dbmaestro"
  },
  {
    company: "RB2B",
    size: "51-200",
    useCase: "Sales Enablement",
    title: "RB2B eliminates 60+ hours of sales calls in 30 days with Supademo",
    detail: "Website Visitor Enrichment",
    href: "/customers/rb2b"
  },
  {
    company: "Beehiiv",
    size: "11-50",
    useCase: "Product Marketing",
    title: "Converting 50% more leads with Supademo",
    detail: "Newsletter & Website Platform",
    href: "/customers/beehiiv"
  },
  {
    company: "Orbitax",
    size: "501-1000",
    useCase: "Customer Success",
    title: "Closing global deals across 195 jurisdictions with Supademo",
    detail: "Global Tax Platform",
    href: "/customers/orbitax"
  },
  {
    company: "Spare",
    size: "51-200",
    useCase: "Product Marketing",
    title: "Delivering massive impact across departments",
    detail: "Mobility Management Platform",
    href: "/customers/spare"
  },
  {
    company: "Greenpeace",
    size: "201-500",
    useCase: "Sales Enablement",
    title: "Enhancing internal digitalization and tool-based knowledge management",
    detail: "International NGO",
    href: "/customers/greenpeace"
  },
  {
    company: "ProcessMaker",
    size: "51-200",
    useCase: "Customer Success",
    title: "Save hundreds of hours on demos and documentation",
    detail: "Workflow Automation",
    href: "/customers/processmaker"
  },
  {
    company: "Send",
    size: "51-200",
    useCase: "Product Marketing",
    title: "Transforming pages into interactive experiences",
    detail: "AI Document Platform",
    href: "/customers/send"
  },
  {
    company: "ReelDX",
    size: "201-500",
    useCase: "Training & Education",
    title: "Drive enablement and onboarding at scale",
    detail: "Health",
    href: "/customers/reeldx"
  },
  {
    company: "Textable",
    size: "51-200",
    useCase: "Customer Success",
    title: "Resolve customer support with proactive demos",
    detail: "Whitelabel SaaS",
    href: "/customers/textable"
  },
  {
    company: "Porter Metrics",
    size: "11-50",
    useCase: "Product Marketing",
    title: "Increase marketing-qualified leads and product adoption",
    detail: "Marketing Analytics",
    href: "/customers/porter-metrics"
  },
  {
    company: "RareCircles",
    size: "51-200",
    useCase: "Customer Success",
    title: "Reduce support burden with self-serve product guides and tutorials",
    detail: "Retail & E-Commerce",
    href: "/customers/rarecircles"
  },
  {
    company: "Senja",
    size: "11-50",
    useCase: "Product Marketing",
    title: "Drive website conversions with interactive product tour",
    detail: "Testimonial Management",
    href: "/customers/senja"
  },
  {
    company: "Simple Testimonial",
    size: "11-50",
    useCase: "Training & Education",
    title: "Scale product-led onboarding with guided product demos",
    detail: "SaaS",
    href: "/customers/simple-testimonial"
  }
] as const;

const customerLogoSources: Record<string, string> = {
  Bullhorn: "https://supademo.com/logos/bullhorn.svg",
  Beehiiv: "https://supademo.com/logos/beehiiv.avif",
  "Easy Software": "https://supademo.com/logos/easy.svg",
  Lightspeed: "https://supademo.com/logos/lightspeed.svg",
  VRIFY: "https://supademo.com/logos/vrify.svg",
  "Rev.io": "https://supademo.com/logos/revio.avif",
  DBmaestro: "https://supademo.com/logos/dbmaestro.avif",
  RB2B: "https://supademo.com/logos/rb2b.svg",
  Orbitax: "https://supademo.com/logos/orbitax-logo.svg",
  Spare: "https://supademo.com/logos/spare.svg",
  Greenpeace: "https://supademo.com/logos/greenpeace-logo.svg",
  ProcessMaker: "https://supademo.com/logos/processmaker.webp",
  Send: "https://supademo.com/logos/send.svg",
  ReelDX: "https://supademo.com/logos/reeldx.svg",
  Textable: "https://supademo.com/logos/textable.avif",
  "Porter Metrics": "https://supademo.com/logos/porter-logo.avif",
  RareCircles: "https://supademo.com/logos/rarecircles-logo.avif",
  Senja: "https://supademo.com/logos/senja-logo.avif",
  "Simple Testimonial": "https://supademo.com/logos/simple-testimonial-logo.svg"
};

const industryRows = [
  ["Bullhorn", "Software", "https://supademo.com/logos/bullhorn.svg", "/customers/bullhorn"],
  ["Beehiiv", "Software", "https://supademo.com/logos/beehiiv.avif", "/customers/beehiiv"],
  ["Easy Software", "Software", "https://supademo.com/logos/easy.svg", "/customers/easy-software"],
  ["ReelDX", "Healthcare", "https://supademo.com/logos/reeldx.svg", "/customers/reeldx"],
  [
    "MidFirst Bank",
    "Finance & Banking",
    "https://supademo.com/logos/midfirst.svg",
    "/product-demo"
  ],
  [
    "Orbitax",
    "Finance & Banking",
    "https://supademo.com/logos/orbitax-logo.svg",
    "/customers/orbitax"
  ],
  ["Rev.io", "Finance & Banking", "https://supademo.com/logos/revio.avif", "/customers/revio"],
  [
    "Doctors Without Borders / MSF",
    "Government & Non-Profit",
    "https://supademo.com/logos/msf.svg",
    "/product-demo"
  ],
  [
    "Greenpeace",
    "Government & Non-Profit",
    "https://supademo.com/logos/greenpeace-logo.svg",
    "/customers/greenpeace"
  ],
  ["Toshiba", "Enterprise", "https://supademo.com/logos/toshiba.svg", "/product-demo"],
  ["Concentrix", "Enterprise", "https://supademo.com/logos/concentrix.svg", "/product-demo"],
  ["Coca-Cola", "Enterprise", "https://supademo.com/logos/cocacola.svg", "/product-demo"],
  ["Alibaba", "Enterprise", "https://supademo.com/logos/alibaba.svg", "/product-demo"],
  ["CVS Health", "Healthcare", "https://supademo.com/logos/cvs.png", "/product-demo"],
  ["NexHealth", "Healthcare", "https://supademo.com/logos/nexhealth.png", "/product-demo"]
] as const;

const industryCategories = [
  "Featured",
  "Enterprise",
  "Software",
  "Healthcare",
  "Finance & Banking",
  "Government & Non-Profit"
] as const;

const customerTestimonials = [
  [
    "Casey O'Brien",
    "Solutions Consulting Director",
    "Supademo has completely transformed how we enable every customer-facing team."
  ],
  [
    "Jon Lo",
    "Head of Growth",
    "We can share a polished product story in minutes and keep the whole team aligned."
  ],
  [
    "Daniela De Almada",
    "Customer Education",
    "Our customers get the answer they need without another meeting on the calendar."
  ],
  [
    "Stefan Alexiev",
    "Product Marketing",
    "The team ships interactive launches faster and with far less production overhead."
  ],
  [
    "Leonard Korkmaz",
    "Sales Enablement",
    "Supademo makes complex workflows feel obvious for every buyer."
  ],
  [
    "Yaniv Yehuda",
    "Founder & CPO",
    "From our first evaluation to full rollout, support has been exceptional."
  ]
] as const;

const sizes = ["All company sizes", "11-50", "51-200", "201-500", "501-1000", "1000+"] as const;
const useCases = [
  "All use cases",
  "Product Marketing",
  "Customer Success",
  "Sales Enablement",
  "Training & Education"
] as const;

export function MarketingCustomers() {
  const [size, setSize] = useState<(typeof sizes)[number]>(sizes[0]);
  const [useCase, setUseCase] = useState<(typeof useCases)[number]>(useCases[0]);
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [sizeOpen, setSizeOpen] = useState(true);
  const [useCaseOpen, setUseCaseOpen] = useState(true);
  const [industryCategory, setIndustryCategory] = useState<(typeof industryCategories)[number]>(
    industryCategories[0]
  );

  const visibleStories = useMemo(
    () =>
      customerStories
        .filter((story) => size === sizes[0] || story.size === size)
        .filter((story) => useCase === useCases[0] || story.useCase === useCase)
        .slice(0, visibleCount),
    [size, useCase, visibleCount]
  );

  function updateSize(next: (typeof sizes)[number]) {
    setSize(next);
    setVisibleCount(12);
  }

  function updateUseCase(next: (typeof useCases)[number]) {
    setUseCase(next);
    setVisibleCount(12);
  }

  return (
    <main className="customers-page" id="main">
      <MarketingHeader />
      <section className="customers-hero" aria-labelledby="customers-title">
        <p className="customers-eyebrow">Customer stories</p>
        <h1 id="customers-title">Teams like yours are driving impact with Supademo</h1>
        <p>
          Thousands of fast-growing companies use Supademo to automate and scale demos across
          customer success, sales and marketing.
        </p>
        <div className="customers-hero-actions">
          <a className="marketing-button" href="/signup">
            Get started for free →
          </a>
          <a className="marketing-button marketing-button-outline" href="/product-demo">
            Request a demo
          </a>
        </div>
        <div className="customers-hero-proof" aria-label="Customer success story">
          <img
            src="https://supademo.com/case-studies/case-study-header.avif"
            alt="Customer success stories"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      <section className="customers-story-library" id="stories" aria-labelledby="stories-title">
        <h2 id="stories-title" className="sr-only">
          Customer story library
        </h2>
        <aside className="customers-filters" aria-label="Filter customer stories">
          <div>
            <strong>Filter by</strong>
          </div>
          <div className="customers-filter-group">
            <button
              type="button"
              className="customers-filter-heading"
              aria-expanded={sizeOpen}
              onClick={() => setSizeOpen((open) => !open)}
            >
              <span>Company Size</span>
              <span aria-hidden="true">{sizeOpen ? "⌃" : "⌄"}</span>
            </button>
            {sizeOpen ? (
              <div className="customers-filter-options">
                {sizes.slice(1).map((option) => (
                  <label key={option}>
                    <input
                      type="checkbox"
                      checked={size === option}
                      onChange={() => updateSize(size === option ? sizes[0] : option)}
                    />
                    <span>
                      {option === "11-50"
                        ? "Startup (1-50)"
                        : option === "51-200"
                          ? "SMB (51-150)"
                          : option === "201-500"
                            ? "Mid-Market (100-500)"
                            : option === "501-1000"
                              ? "Enterprise (500+)"
                              : "Enterprise (500+)"}
                    </span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          <div className="customers-filter-group">
            <button
              type="button"
              className="customers-filter-heading"
              aria-expanded={useCaseOpen}
              onClick={() => setUseCaseOpen((open) => !open)}
            >
              <span>Use Case</span>
              <span aria-hidden="true">{useCaseOpen ? "⌃" : "⌄"}</span>
            </button>
            {useCaseOpen ? (
              <div className="customers-filter-options">
                {useCases.slice(1).map((option) => (
                  <label key={option}>
                    <input
                      type="checkbox"
                      checked={useCase === option}
                      onChange={() => updateUseCase(useCase === option ? useCases[0] : option)}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          <p>{visibleStories.length} stories</p>
        </aside>
        <div
          className="customers-story-grid"
          key={`${size}-${useCase}-${visibleCount}`}
          aria-live="polite"
        >
          {visibleStories.map((story) => (
            <article className="customer-story-card" key={`${story.company}-${story.title}`}>
              <div className="customer-story-logo">
                <img
                  src={customerLogoSources[story.company] ?? customerLogoSources.Beehiiv}
                  alt={`${story.company} logo`}
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                />
              </div>
              <span>{story.company}</span>
              <h3>{story.title}</h3>
              <p>{story.detail}</p>
              <a href={story.href}>Read story →</a>
            </article>
          ))}
          {visibleStories.length === 0 ? (
            <p className="customers-empty">No stories match these filters yet.</p>
          ) : null}
          {visibleCount < customerStories.length && visibleStories.length > 0 ? (
            <button
              type="button"
              className="customers-show-more"
              onClick={() => setVisibleCount((current) => current + 7)}
            >
              Show 7 more
            </button>
          ) : null}
        </div>
      </section>

      <section className="customers-stats" aria-labelledby="customers-stats-title">
        <h2 id="customers-stats-title">Powering 20,000+ ambitious teams across 100+ countries</h2>
        <div>
          <article>
            <strong>
              1<span>x</span>
            </strong>
            <p>Conversion vs. traditional demo videos</p>
          </article>
          <article>
            <strong>
              18<span>%</span>
            </strong>
            <p>Average time saved on demo creation</p>
          </article>
          <article>
            <strong>
              5<span>%</span>
            </strong>
            <p>Reduction in customer acquisition cost</p>
          </article>
        </div>
      </section>
      <section className="customers-industries" aria-labelledby="customers-industries-title">
        <h2 id="customers-industries-title" className="sr-only">
          Featured customer industries
        </h2>
        <div className="customers-industry-tabs" role="tablist" aria-label="Customer industries">
          {industryCategories.map((category) => (
            <button
              type="button"
              role="tab"
              key={category}
              aria-selected={category === industryCategory}
              onClick={() => setIndustryCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <div className="customers-industry-table" aria-live="polite">
          {industryRows
            .filter(
              ([, category]) => industryCategory === "Featured" || category === industryCategory
            )
            .map(([company, category, logo, href]) => (
              <a className="customers-industry-row" href={href} key={`${company}-${category}`}>
                <span className="customers-industry-logo">
                  <img
                    src={logo}
                    alt={`${company} logo`}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </span>
                <strong>{company}</strong>
                <span>{category}</span>
                <span className="customers-industry-action">
                  {href === "/product-demo" ? "Visit site ↗" : "Read story →"}
                </span>
              </a>
            ))}
        </div>
      </section>
      <section className="customers-testimonials" aria-labelledby="customers-testimonials-title">
        <div className="customers-testimonials-heading">
          <h2 id="customers-testimonials-title">Straight from the people who use Supademo most</h2>
          <p>
            Teams across sales, marketing, support, and education use Supademo to make the product
            easier to understand.
          </p>
        </div>
        <div className="customers-testimonial-grid">
          {customerTestimonials.map(([name, role, quote]) => (
            <article className="customers-testimonial-card" key={name}>
              <div className="customers-testimonial-avatar" aria-hidden="true">
                {name.slice(0, 1)}
              </div>
              <p>“{quote}”</p>
              <strong>{name}</strong>
              <span>{role}</span>
            </article>
          ))}
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
