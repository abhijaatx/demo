import { MarketingHeader } from "./marketing-chrome";
import { MarketingReferenceFooter } from "./marketing-download";

type Playbook = {
  icon: string;
  title: string;
  description: string;
  href: string;
};

const playbooks: readonly Playbook[] = [
  {
    icon: "✧",
    title: "The PLG Onboarding Gallery",
    description:
      "Discover the best product-led onboarding flows from top SaaS tools like Notion, Figma, Linear, and more.",
    href: "/user-flow-examples"
  },
  {
    icon: "⌕",
    title: "State of Interactive Demos (2026 Report)",
    description:
      "Trends, data, and tactics for creating exceptional product demos, surveyed from 212 professionals in sales, CS and GTM.",
    href: "/content/state-of-interactive-demos-2026"
  },
  {
    icon: "$",
    title: "The Product-Led SEO Playbook",
    description:
      "Learn specific tactics Supademo used to scale from $100K to >$1M ARR in 12 months, with a profitable team of 10.",
    href: "/content/product-led-seo"
  },
  {
    icon: "▣",
    title: "The ABM Strategy For Proven ARR Growth",
    description:
      "4 proven automated ABM tactics that drove 590% ARR growth with a lean team of three.",
    href: "/content/abm"
  },
  {
    icon: "ϟ",
    title: "The Onboarding & Activation Bible",
    description:
      "Increase activation rates by 250% with 28 proven onboarding tactics organized by implementation effort.",
    href: "/content/activation"
  },
  {
    icon: "♧",
    title: "How to Get Your First 100 Users on Reddit (Without Spending a Dollar)",
    description:
      "The exact, unscaleable Reddit playbook we used to get Supademo's first customers — without spending a dollar.",
    href: "/content/get-users-reddit"
  }
] as const;

function ContentDirectoryCta() {
  return (
    <section className="content-directory-cta" aria-labelledby="content-directory-cta-title">
      <img
        className="content-directory-cta-art content-directory-cta-art-left"
        src="https://supademo.com/images/Frame-1321314117.svg"
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <img
        className="content-directory-cta-face content-directory-cta-face-left"
        src="https://supademo.com/images/hero_face-man.avif"
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <div className="content-directory-cta-copy">
        <h2 id="content-directory-cta-title">
          The fastest way to create interactive product demos
        </h2>
        <p>
          Close deals faster, drive enablement and scale product onboarding with engaging, AI
          interactive product demos.
        </p>
        <a href="/signup">Create your first Supademo</a>
      </div>
      <img
        className="content-directory-cta-art content-directory-cta-art-right"
        src="https://supademo.com/images/supademo-footer-image.svg"
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
      />
      <img
        className="content-directory-cta-face content-directory-cta-face-right"
        src="https://supademo.com/images/hero-face-woman.avif"
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </section>
  );
}

export function MarketingContentDirectoryPage() {
  return (
    <main className="content-directory-exact-page" id="main">
      <MarketingHeader />
      <section className="content-directory-exact-hero" aria-labelledby="content-directory-title">
        <div className="content-directory-exact-copy">
          <h1 id="content-directory-title">Strategic playbooks and content to help you grow</h1>
          <p>
            Explore free content to help you create better demos, convert more prospects, and
            amplify your reach.
          </p>
          <a className="content-directory-exact-button" href="#list">
            Explore free content
          </a>
        </div>
        <img
          className="content-directory-exact-preview"
          src="https://supademo.com/features/edit-header-min.avif"
          alt="Tool preview"
          loading="eager"
          referrerPolicy="no-referrer"
        />
      </section>
      <section
        className="content-directory-exact-library"
        id="list"
        aria-labelledby="content-directory-list-title"
      >
        <h2 id="content-directory-list-title">Tactical, step-by-step playbooks to help you grow</h2>
        <div className="content-directory-exact-grid">
          {playbooks.map((playbook) => (
            <article className="content-directory-exact-card" key={playbook.href}>
              <span className="content-directory-exact-icon" aria-hidden="true">
                {playbook.icon}
              </span>
              <h3>{playbook.title}</h3>
              <p>{playbook.description}</p>
              <a href={playbook.href}>
                Get access <span aria-hidden="true">→</span>
              </a>
            </article>
          ))}
        </div>
      </section>
      <ContentDirectoryCta />
      <MarketingReferenceFooter />
    </main>
  );
}
