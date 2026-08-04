"use client";

import { useState } from "react";

const goals = [
  "Demos for product marketing and growth",
  "Sales demos, outbound, and follow-ups",
  "Customer onboarding and training",
  "Internal training and documentation",
  "Multiple use cases",
  "Just exploring for now!"
] as const;

const avatars = [
  ["Joseph", "https://supademo.com/images/team/joseph.avif"],
  ["Fredo", "https://supademo.com/headshots/fredo-headshot.avif"],
  ["Paulina", "https://supademo.com/headshots/paulina-headshot.avif"],
  ["Demo host", "https://supademo.com/headshots/demo-rep-1.avif"]
] as const;

const proof = [
  [
    "VRIFY",
    "https://supademo.com/logos/vrify.svg",
    "Supademo has allowed us to rapidly increase our onboarding and knowledge creation at VRIFY.",
    "Nova Siegmann",
    "Sr. Manager, Product Enablement",
    "75%",
    "Faster content production"
  ],
  [
    "beehiiv",
    "https://supademo.com/logos/beehiiv.avif",
    "We've driven several thousand signups through our demo experience so far. Supademo is a key part of our lead generation strategy.",
    "EJ White",
    "Head of Growth",
    "50%",
    "Better conversion rates"
  ],
  [
    "Easy",
    "https://supademo.com/logos/easy.svg",
    "Supademo has been a huge asset across multiple departments and workflows across Easy Software.",
    "Felix True",
    "Head of Presales",
    "$100k+",
    "Contracts closed"
  ],
  [
    "Bullhorn",
    "https://supademo.com/logos/bullhorn.svg",
    "Supademo helps us meet customers where they are — delivering quick, clear, and interactive training that saves us hours.",
    "Robert Hoffmann",
    "Instructional Designer",
    "50%",
    "Faster content creation"
  ],
  [
    "Spare",
    "https://supademo.com/logos/spare.svg",
    "Supademo has become an invaluable part of various workflows at Spare. Supademo has made a massive impact for us.",
    "Kristoffer Vik Hansen",
    "Co-founder & CEO",
    "10x",
    "Workflow efficiency"
  ],
  [
    "RB2B",
    "https://supademo.com/logos/rb2b.svg",
    "Supademo has allowed us to deliver the same high quality demos as we would in person, while letting users explore at their own pace.",
    "Robb Clarke",
    "Head of AI",
    "60+",
    "Hours of sales calls saved"
  ],
  [
    "DBmaestro",
    "https://supademo.com/logos/dbmaestro.avif",
    "Supademo is proving to be a game-changer for pre-sales, sales, and partner enablement. From our very first evaluation to full production rollout, support has been exceptional.",
    "Yaniv Yehuda",
    "Founder & CPO",
    "80%",
    "Faster demo delivery"
  ],
  [
    "Lightspeed",
    "https://supademo.com/logos/lightspeed.svg",
    "If it's speed, effectiveness, efficiency, and cutting down hours of development and production—all of those can be answered with a 'yes' by Supademo.",
    "Tom Aponte",
    "Sr. Customer Education Program Manager",
    "60%",
    "Faster content production"
  ],
  [
    "ProcessMaker",
    "https://supademo.com/logos/processmaker.svg",
    "Supademo has completely transformed our early-stage demo motion. Gone are the days of custom demos for unqualified prospects.",
    "Casey O’Brien",
    "Solutions Consulting Director",
    "100s",
    "Hours saved on demos"
  ]
] as const;

const trustLogos = [
  ["Siemens", "https://supademo.com/logos/simens.svg"],
  ["Tealium", "https://supademo.com/logos/tealium.svg"],
  ["Plaid", "https://supademo.com/logos/plaid.svg"],
  ["beehiiv", "https://supademo.com/logos/beehiiv.avif"],
  ["Hewlett Packard Enterprise", "https://supademo.com/logos/hpe.svg"],
  ["Opentrons", "https://supademo.com/logos/opentrons.svg"],
  ["Tennr", "https://supademo.com/logos/tennr.svg"],
  ["Lightspeed", "https://supademo.com/logos/lightspeed.svg"]
] as const;

type FormState = { name: string; email: string; goal: string };

export function MarketingProductDemo() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", goal: "" });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value.slice(0, field === "email" ? 254 : 120) }));
    setError("");
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !form.name.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ||
      !goals.includes(form.goal as (typeof goals)[number])
    ) {
      setError("Add your name, a work email, and one goal to continue.");
      return;
    }
    setSubmitted(true);
  }

  return (
    <main className="product-demo-page" id="main">
      <section className="product-demo-form-panel" aria-labelledby="product-demo-title">
        <div className="product-demo-form-inner">
          <h1 id="product-demo-title">
            <span>See Supademo in action</span>
            <span className="product-demo-avatar-stack" aria-label="Supademo demo team">
              {avatars.map(([name, src], index) => (
                <span className={`product-demo-avatar product-demo-avatar-${index + 1}`} key={name}>
                  <img
                    src={src}
                    alt={name}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                </span>
              ))}
            </span>
          </h1>
          <p>
            Curious to discover how Supademo can help your company scale? Get in touch with our team
            to learn more.
          </p>
          {submitted ? (
            <div className="product-demo-success" role="status">
              <strong>Thanks — we&apos;ll be in touch.</strong>
              <p>Your request is ready for the Supademo team to review.</p>
              <button type="button" onClick={() => setSubmitted(false)}>
                Edit request
              </button>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="product-demo-fields-row">
                <label>
                  Full name<span aria-hidden="true">*</span>
                  <input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    placeholder="Jane Doe"
                    autoComplete="name"
                  />
                </label>
                <label>
                  Work email<span aria-hidden="true">*</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    placeholder="jane@company.com"
                    autoComplete="email"
                  />
                </label>
              </div>
              <label>
                What are you looking to improve?<span aria-hidden="true">*</span>
                <select
                  value={form.goal}
                  onChange={(event) => updateField("goal", event.target.value)}
                >
                  <option value="">Select one</option>
                  {goals.map((goal) => (
                    <option key={goal}>{goal}</option>
                  ))}
                </select>
              </label>
              {error ? (
                <p className="product-demo-error" role="alert">
                  {error}
                </p>
              ) : null}
              <div className="product-demo-actions">
                <button className="marketing-button" type="submit">
                  Next
                </button>
                <a className="product-demo-skip" href="/signup?source=instant-ai-demo">
                  ✦ <span>Or skip the wait and get an instant AI demo</span>
                </a>
              </div>
            </form>
          )}
        </div>
      </section>
      <aside className="product-demo-proof" aria-labelledby="product-demo-proof-title">
        <h2 id="product-demo-proof-title">Modern teams scale with Supademo</h2>
        <div className="product-demo-proof-viewport" aria-label="Customer proof carousel">
          <div className="product-demo-proof-track">
            {[...proof, ...proof].map(
              ([company, logo, quote, person, role, metric, metricLabel], index) => (
                <article className="product-demo-proof-card" key={`${company}-${index}`}>
                  <div className="product-demo-company">
                    <img
                      src={logo}
                      alt={`${company} logo`}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <p>“{quote}”</p>
                  <div className="product-demo-person">
                    <strong>{person}</strong>
                    <span>{role}</span>
                  </div>
                  <div className="product-demo-metric">
                    <strong>{metric}</strong>
                    <span>{metricLabel}</span>
                  </div>
                  <span className="product-demo-card-arrow" aria-hidden="true">
                    ↗
                  </span>
                </article>
              )
            )}
          </div>
        </div>
        <p className="product-demo-trusted">Trusted by 200,000 professionals and 3,000 companies</p>
        <div className="product-demo-trust-logos" aria-label="Trusted companies">
          {trustLogos.map(([name, src]) => (
            <span key={name}>
              <img
                src={src}
                alt={`${name} logo`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            </span>
          ))}
        </div>
      </aside>
    </main>
  );
}
