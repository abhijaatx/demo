import { MarketingFooter, MarketingHeader } from "./marketing-chrome";
import { MarketingContentPage } from "./marketing-content-page";

type MarketingReferencePageProps = {
  slug: readonly string[];
};

const pageCopy: Record<string, { eyebrow: string; title: string; description: string }> = {
  pricing: {
    eyebrow: "Plans for every team",
    title: "Make every product explanation easier to share.",
    description:
      "Choose the workspace that matches how your team records, edits, and publishes product stories."
  },
  blog: {
    eyebrow: "Supademo journal",
    title: "Ideas for making product knowledge easier to experience.",
    description:
      "Practical notes on interactive demos, onboarding, enablement, and the craft of showing useful work."
  },
  features: {
    eyebrow: "Product capabilities",
    title: "Give every workflow a clear next step.",
    description:
      "Capture a real moment, add just enough guidance, and share a focused path with the people who need it."
  },
  "use-cases": {
    eyebrow: "Built around the work",
    title: "Turn product knowledge into momentum.",
    description:
      "Help sales, marketing, product, and customer teams show the right experience at the right time."
  },
  customers: {
    eyebrow: "Customer stories",
    title: "See how modern teams show the work.",
    description:
      "Explore the workflows teams use to make onboarding, launches, and product education more useful."
  },
  tools: {
    eyebrow: "Free tools",
    title: "Start with a useful moment.",
    description:
      "Use a focused starting point to turn a screenshot, recording, or written process into something people can follow."
  },
  resources: {
    eyebrow: "Resources",
    title: "Make the next explanation the last one you need to give.",
    description:
      "Browse guides, examples, and practical frameworks for building demos that move work forward."
  }
};

// Keep metadata generation server-safe. The interactive industry page is a client
// component, so importing its helpers here would make Next try to call client
// functions while rendering route metadata.
const industryMetadata: Record<string, { title: string; description: string }> = {
  software: {
    title: "Accelerate Adoption and Growth Across Your Software Stack",
    description:
      "Supademo helps software teams simplify training, support, adoption, and enablement with interactive demos that scale across your organization."
  },
  healthcare: {
    title: "Interactive Healthcare Demos That Cut Training Time and Boost Adoption",
    description:
      "Simplify staff training, compliance, and patient onboarding with step-by-step interactive demos that scale across your organization."
  },
  "finance-banking": {
    title: "Drive Financial Compliance and Customer Clarity with Interactive Demos",
    description:
      "From fintech startups to enterprise banks, Supademo helps teams onboard customers, train agents, and market products—faster and smarter."
  },
  government: {
    title: "Modernize Training and Public Service With Guided Demos and Tutorials",
    description:
      "Simplify how your teams, citizens, and partners use standard government services and processes with secure, interactive demos."
  }
};

function toTitle(segment: string): string {
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getCopy(slug: readonly string[]) {
  const category = slug[0] ?? "resources";
  return (
    pageCopy[category] ?? {
      eyebrow: "Supademo",
      title: `${toTitle(slug.at(-1) ?? "Product demos")} made easier to experience.`,
      description:
        "A calm, guided way to show the product, answer the next question, and keep the story moving."
    }
  );
}

export function MarketingReferencePage({ slug }: MarketingReferencePageProps) {
  const key = slug.filter(Boolean).join("/");
  if (
    key === "blog" ||
    key.startsWith("blog/") ||
    key === "content" ||
    key.startsWith("content/") ||
    key === "careers" ||
    key === "ai" ||
    key.startsWith("ai/") ||
    key.startsWith("industries/") ||
    key === "terms-of-service" ||
    key === "privacy-policy" ||
    key === "privacy-policy/ai" ||
    key === "dpa" ||
    key === "security"
  ) {
    return <MarketingContentPage slug={slug} />;
  }
  const copy = getCopy(slug);
  const pageLabel = slug.map(toTitle).join(" / ");

  return (
    <main className="marketing-reference-page" id="main">
      <MarketingHeader />
      <section className="marketing-reference-hero" aria-labelledby="marketing-reference-title">
        <div className="marketing-reference-copy">
          <p className="marketing-announcement">{copy.eyebrow}</p>
          <p className="marketing-reference-breadcrumb">Supademo / {pageLabel}</p>
          <h1 id="marketing-reference-title">{copy.title}</h1>
          <p>{copy.description}</p>
          <div className="marketing-hero-actions">
            <a className="marketing-button" href="/signup">
              Start for free
            </a>
            <a className="marketing-text-action" href="/product">
              Explore the product
            </a>
          </div>
        </div>
        <div className="marketing-reference-art" aria-label="Interactive demo preview" role="img">
          <div className="marketing-reference-window-bar" aria-hidden="true">
            <span />
            <span />
            <span />
            <strong>{pageLabel || "Supademo"}</strong>
          </div>
          <div className="marketing-reference-art-grid" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </div>
          <div className="marketing-reference-art-card">
            <small>Guided product story</small>
            <strong>Show the useful path.</strong>
            <p>One clear step at a time.</p>
            <span>Continue →</span>
          </div>
        </div>
      </section>

      <section className="marketing-reference-grid" aria-label="What you can do">
        {[
          [
            "Capture a moment",
            "Start with a screen, a recording, or a workflow your team already knows."
          ],
          [
            "Shape the path",
            "Add concise guidance so viewers always know where they are and what comes next."
          ],
          [
            "Share with confidence",
            "Publish one focused link, embed, or presentation view for every audience."
          ]
        ].map(([title, description], index) => (
          <article className="marketing-reference-card" key={title}>
            <span aria-hidden="true">0{index + 1}</span>
            <h2>{title}</h2>
            <p>{description}</p>
            <a href="/product">Learn more →</a>
          </article>
        ))}
      </section>

      <section className="marketing-reference-cta" aria-labelledby="marketing-reference-cta-title">
        <div>
          <p className="marketing-announcement">
            One place to make the product easier to experience
          </p>
          <h2 id="marketing-reference-cta-title">
            Start with one workflow. The rest gets easier to show.
          </h2>
        </div>
        <a className="marketing-button marketing-button-light" href="/signup">
          Create your first demo
        </a>
      </section>
      <MarketingFooter />
    </main>
  );
}

export function getMarketingReferenceMetadata(slug: readonly string[]) {
  const key = slug.filter(Boolean).join("/");
  const legalMetadata: Record<string, { title: string; description: string }> = {
    "terms-of-service": {
      title: "Supademo | Terms of Service",
      description:
        "Showcase your product with interactive, self-guided product demos that can be easily embedded in your website and blogs. And boost your website conversions."
    },
    "privacy-policy": {
      title: "Privacy Policy and Data Security | Supademo",
      description:
        "Showcase your product with interactive, self-guided product demos that can be easily embedded in your website and blogs. And boost your website conversions."
    },
    "privacy-policy/ai": {
      title: "AI Policy | Supademo",
      description: "Learn about Supademo's AI policy."
    },
    dpa: {
      title: "Data Processing Agreement | Supademo",
      description:
        "How Supademo processes personal data on behalf of customers: GDPR Standard Contractual Clauses, UK Addendum, subprocessors, security, and CCPA terms."
    }
  };
  if (legalMetadata[key]) return legalMetadata[key];
  if (key === "content/state-of-interactive-demos-2026") {
    return {
      title: "State of Interactive Demos 2026: Industry Research Report | Supademo",
      description:
        "Explore data and insights from 200+ professionals and 150,000+ interactive demos on how to drive impact across sales, customer success, marketing, and more."
    };
  }
  if (key === "blog/product-updates") {
    return {
      title: "Product Updates | Supademo Blog",
      description: "Product updates, new features, and workflow improvements from Supademo."
    };
  }
  const articleMetadata: Record<string, { title: string; description: string }> = {
    "blog/product-update-may-recap": {
      title:
        "New in May 2026: Free 4K Screen Recording, Showcases 2.0, Pronounciation Dictionary | Supademo Blog",
      description: "Supademo's May 2026 product updates."
    },
    "blog/best-ai-bdr-tools": {
      title: "8 AI BDR Tools to Build More Pipeline in 2026 | Supademo Blog",
      description: "Best AI BDR tools for outbound, pipeline, and demo-led qualification."
    },
    "blog/rise-of-ai-demo-agents": {
      title: "AI Demo Agents: A Founder's POV On New B2B SaaS Demo Motion | Supademo Blog",
      description: "A founder's view on the new B2B SaaS demo motion."
    }
  };
  if (articleMetadata[key]) return articleMetadata[key];
  const legacyBlogMetadata: Record<string, { title: string; description: string }> = {
    "blog/sales/interactive-product-demo": {
      title: "Create Interactive Demos: Benefits, Usecases, Tips | Supademo Blog",
      description: "Interactive Product Demo 101: A Complete Guide"
    },
    "blog/sales/create-better-interactive-demos": {
      title: "Step-by-Step Guide: 7 Tips on Creating Better Interactive Demos | Supademo Blog",
      description:
        "Learn how to create better interactive demos with a focused, repeatable workflow."
    },
    "blog/sales/leveraging-interactive-demos": {
      title: "Top 6 Interactive Product Demo Use Cases You Need to Know | Supademo Blog",
      description: "Explore the top interactive product demo use cases across the buyer journey."
    },
    "blog/startup/how-supademo-uses-supademo": {
      title: "How Supademo uses Supademo for Demo Automation | Supademo Blog",
      description: "A behind-the-scenes look at how Supademo uses Supademo for demo automation."
    }
  };
  if (legacyBlogMetadata[key]) return legacyBlogMetadata[key];
  const industrySlug = slug[1] ?? "";
  const industry =
    slug[0] === "industries" && slug.length === 2 ? industryMetadata[industrySlug] : undefined;
  if (industry) {
    return {
      title: `${industry.title} | Supademo`,
      description: industry.description
    };
  }
  const copy = getCopy(slug);
  return { title: `${copy.title} | Supademo`, description: copy.description };
}
