import { MarketingFooter, MarketingHeader } from "./marketing-chrome";
import {
  UseCasePopularPanel,
  UseCaseScaleRail,
  UseCaseTrustExplorer,
  type UseCasePopularMode,
  type UseCaseScaleCard
} from "./use-case-detail-interactions";

type UseCaseCard = {
  title: string;
  description: string;
  image: string;
  alt: string;
};

type UseCaseDetail = {
  label: string;
  title: string;
  description: string;
  heroImage: string;
  heroAlt: string;
  statsTitle?: string;
  stats?: readonly [string, string][];
  storyEmbed?: string;
  blueCards: readonly UseCaseCard[];
  blueHeight: number;
  testimonial: {
    logo: string;
    logoAlt: string;
    quote: string;
    name: string;
    role: string;
    headshot?: string;
  };
  testimonialHeight: number;
  popular: UseCasePopularMode;
  faq: readonly [string, string][];
  faqHeight: number;
};

const scaleCards: readonly UseCaseScaleCard[] = [
  {
    title: "Record Interactive Demos",
    description: "Record demos in HTML, screenshot, video or in multi-demo formats.",
    image: "https://supademo.com/images/scale-01.avif",
    alt: "Record Interactive Demos"
  },
  {
    title: "Advanced Analytics",
    description: "Get deep insights into dropoff rates, conversion, engagement, and viewers.",
    image: "https://supademo.com/images/scale-02.avif",
    alt: "Advanced Analytics"
  },
  {
    title: "Team Workspaces",
    description: "Asynchronously share, organize, and collaborate on Supademos as a team.",
    image: "https://supademo.com/images/scale-03.avif",
    alt: "Team Workspaces"
  },
  {
    title: "Trigger as In-App Tour",
    description: "Programmatically trigger in-app tours to better onboard and guide your users.",
    image: "https://supademo.com/images/scale-04.avif",
    alt: "Trigger as In-App Tour"
  },
  {
    title: "Auto-Translation",
    description: "Translate your product demos instantly in 15+ languages with the power of AI.",
    image: "https://supademo.com/images/scale-05.avif",
    alt: "Auto-Translation"
  },
  {
    title: "AI Voiceovers",
    description: "Elevate demos with AI voice narration that keeps every story moving.",
    image: "https://supademo.com/images/scale-06.avif",
    alt: "AI Voiceovers"
  },
  {
    title: "Guided HTML Demos",
    description: "Turn a browser workflow into an interactive, self-paced experience.",
    image: "https://supademo.com/images/scale-07.avif",
    alt: "Guided HTML Demos"
  },
  {
    title: "Sandbox Demos",
    description: "Let viewers explore a realistic product path without touching production.",
    image: "https://supademo.com/images/scale-09.avif",
    alt: "Sandbox Demos"
  }
];

const commonPopularModes: readonly UseCasePopularMode[] = [
  {
    label: "Sales & Enablement",
    title: "Qualify and close deals faster",
    description:
      "Close more deals by pre-qualifying prospects and involving decision makers through interactive product demos.",
    image: "https://supademo.com/images/usecase-sales.avif",
    imageAlt: "Qualify and close deals faster",
    href: "/use-cases/sales-enablement"
  },
  {
    label: "Marketing & Growth",
    title: "Scale product-led marketing",
    description:
      "Demonstrate product value through interactive visualization rather than static content, without adding friction.",
    image: "https://supademo.com/images/usecase-marketing.avif",
    imageAlt: "Scale product-led marketing",
    href: "/use-cases/product-marketing"
  },
  {
    label: "Customer Success",
    title: "Turn customers into champions",
    description:
      "Guide customers to product success with reusable, self-paced walkthroughs that make every interaction count.",
    image: "https://supademo.com/images/usecase-customer-success.avif",
    imageAlt: "Turn customers into champions",
    href: "/use-cases/customer-success"
  },
  {
    label: "Onboarding",
    title: "Accelerate time-to-value",
    description:
      "Modernize onboarding with guided interactive demos that teach key features and shorten learning curves.",
    image: "https://supademo.com/images/usecase-onboarding.avif",
    imageAlt: "Accelerate time-to-value",
    href: "/use-cases/product-onboarding"
  },
  {
    label: "Support",
    title: "Reduce support burden at scale",
    description:
      "Minimize support tickets and speed resolution with interactive walkthroughs that answer questions immediately.",
    image: "https://supademo.com/images/usecase-support.avif",
    imageAlt: "Reduce support burden at scale",
    href: "/use-cases/customer-support"
  },
  {
    label: "Product",
    title: "Test products & iterate faster",
    description:
      "Use interactive demos as prototypes to validate features, gather early feedback, and refine experiences.",
    image: "https://supademo.com/images/usecase-product.avif",
    imageAlt: "Test products and iterate faster",
    href: "/use-cases/product"
  },
  {
    label: "Training",
    title: "Scale internal training",
    description:
      "Empower employees to learn asynchronously through guides embedded in documentation and learning platforms.",
    image: "https://supademo.com/images/usecase-training.avif",
    imageAlt: "Scale internal training",
    href: "/use-cases/education-training"
  }
];

const details: Record<string, UseCaseDetail> = {
  "sales-enablement": {
    label: "Sales & Enablement",
    title: "Double your revenue with interactive demos",
    description:
      "Delight, build rapport and pre-qualify prospects using personalized sales demos with Supademo.",
    heroImage: "https://supademo.com/images/hero-sales-ui.avif",
    heroAlt: "Sales enablement hero",
    statsTitle: "Boost conversions with effective sales enablement",
    stats: [
      ["4%", "Increase in MQLs to SQLs"],
      ["3%", "Increase in deal velocity"],
      ["2%", "Reduction in CAC"]
    ],
    storyEmbed: "https://app.supademo.com/embed/cm5vi5ctq02oh150i9lpljr5s",
    blueCards: [
      [
        "Outbound campaigns",
        "Quickly qualify prospects and build trust by sharing a self-paced, engaging product demo without the live demo risk.",
        "https://supademo.com/images/sales-outbound.webp"
      ],
      [
        "Recaps and follow-ups",
        "Help reinforce key features and benefits while arming champions with an effective way to sell to decision makers.",
        "https://supademo.com/images/sales-recaps.webp"
      ],
      [
        "Tradeshows & webinars",
        "Create interactive and autoplay product demos for multiple personas without hours of scripting and editing.",
        "https://supademo.com/images/sales-tradeshows.webp"
      ],
      [
        "Live sandbox demos",
        "Transform sales operations with no-code interactive environments and realistic sample data.",
        "https://supademo.com/images/sales-sandbox.webp"
      ],
      [
        "Personalized sales demos",
        "Boost conversions through dynamic variables, conditional logic, and custom content.",
        "https://supademo.com/images/sales-personalized.webp"
      ],
      [
        "Identify your hottest leads",
        "Use engagement signals to focus follow-up on the people showing real buying intent.",
        "https://supademo.com/images/sales-leads.webp"
      ]
    ].map(([title, description, image]) => ({ title, description, image, alt: title })),
    blueHeight: 852,
    testimonial: {
      logo: "https://supademo.com/logos/processmaker.webp",
      logoAlt: "ProcessMaker",
      quote:
        "Supademo has completely transformed our early-stage demo motion. Gone are the days of custom demos for unqualified prospects.",
      name: "Casey O'Brien",
      role: "Solutions Consulting Director",
      headshot: "https://supademo.com/headshots/casey-headshot.avif"
    },
    testimonialHeight: 574,
    popular: commonPopularModes[0],
    faq: [
      [
        "What's the best way to prepare for a sales demo?",
        "Understand your audience's needs, tailor the flow, practice the delivery, and use an interactive demo for an immersive experience."
      ],
      [
        "Why are interactive demos important for sales?",
        "They let prospects experience the product hands-on, building trust and facilitating quicker deal closures."
      ],
      [
        "What is a demo engineer?",
        "A demo engineer builds, maintains, and delivers compelling product experiences for prospects and customers."
      ],
      [
        "What is a sales demo environment?",
        "It is a safe, focused environment where buyers can explore a product without production risk."
      ],
      [
        "What are the benefits of using an interactive demo tool like Supademo for sales enablement?",
        "Teams qualify earlier, share consistent stories, and keep the next step available after every conversation."
      ]
    ],
    faqHeight: 827
  },
  "product-marketing": {
    label: "Marketing & Growth",
    title: "Supercharge your funnel with interactive product demos",
    description:
      "Showcase your product's features and benefits across landing pages, changelogs, and product blogs with Supademo.",
    heroImage: "https://supademo.com/images/hero-marketing-ui.avif",
    heroAlt: "Product marketing hero",
    statsTitle: "Drive productivity across the entire team",
    stats: [
      ["3x", "Conversion vs. traditional demo videos"],
      ["50%", "Average time saved on demo creation"],
      ["40%", "Reduction in customer acquisition cost"]
    ],
    storyEmbed: "https://app.supademo.com/embed/cm5vne99l03vo3v0ixqr58oma",
    blueCards: [
      [
        "Websites and landing pages",
        "Embed interactive demos on websites to highlight your product's aha moment without a subscription paywall.",
        "https://supademo.com/images/marketing-websites.webp"
      ],
      [
        "Email & social campaigns",
        "Drive product-led marketing with interactive demos in campaigns that build awareness and conversion.",
        "https://supademo.com/images/marketing-email.webp"
      ],
      [
        "Product launches & updates",
        "Increase adoption by using interactive demos to introduce new and existing features.",
        "https://supademo.com/images/marketing-launches.webp"
      ],
      [
        "Drive feature adoption",
        "Embed interactive demos in changelogs and product updates to walk through new benefits.",
        "https://supademo.com/images/marketing-feature-adoption.webp"
      ]
    ].map(([title, description, image]) => ({ title, description, image, alt: title })),
    blueHeight: 624,
    testimonial: {
      logo: "https://supademo.com/logos/porter-logo.avif",
      logoAlt: "Porter",
      quote:
        "We save hours on our content creation process, and it helps us show users the value of our product within a few clicks through the demos.",
      name: "Daniela De Almada",
      role: "Head of Marketing",
      headshot: "https://supademo.com/headshots/daniela-photo.avif"
    },
    testimonialHeight: 610,
    popular: commonPopularModes[1],
    faq: [
      [
        "What is a product-led marketing strategy?",
        "Product-led marketing leverages the product experience as the primary driver for awareness, adoption, and growth."
      ],
      [
        "What is an interactive demo or product demo video?",
        "A product demo shows a product in action and lets a viewer understand the value at their own pace."
      ],
      [
        "How do you make a good demo video?",
        "Start with one clear outcome, keep the story concise, and show the workflow rather than describing it."
      ],
      [
        "How can product demo videos support product led marketing?",
        "They make the product experience available at every point in the funnel, from landing page to follow-up."
      ],
      [
        "What are the benefits of using an interactive demo tool like Supademo for demo marketing?",
        "Teams publish faster, learn where buyers engage, and update one source instead of recreating every asset."
      ],
      [
        "How can I leverage product demo videos and interactive demos for effective demo marketing?",
        "Pair a short video with an interactive path so visitors can move from context to hands-on exploration."
      ]
    ],
    faqHeight: 1012
  },
  "customer-success": {
    label: "Customer Success",
    title: "Drive customers to success with interactive demos",
    description:
      "Elevate your onboarding process, craft captivating support documents, and guide customers to product success with Supademo.",
    heroImage: "https://supademo.com/images/hero-customer-success.avif",
    heroAlt: "Customer success hero",
    storyEmbed: "https://app.supademo.com/embed/cm5vgsluo027c3v0i7dduvd27",
    blueCards: [
      [
        "Knowledge base",
        "Embed interactive walkthroughs into knowledge resources so customers can learn without waiting.",
        "https://supademo.com/images/cs-knowledge-base.avif"
      ],
      [
        "Customer training",
        "Turn repetitive training into reusable, visual learning that keeps customers moving.",
        "https://supademo.com/images/cs-training.avif"
      ],
      [
        "Async onboarding",
        "Give every new customer a clear, self-paced path to first value.",
        "https://supademo.com/images/cs-onboarding.avif"
      ],
      [
        "Scale self-serve guidance",
        "Embed Supademos throughout support docs, product guides, and onboarding.",
        "https://supademo.com/images/popular-usecase-04.avif"
      ]
    ].map(([title, description, image]) => ({ title, description, image, alt: title })),
    blueHeight: 624,
    testimonial: {
      logo: "https://supademo.com/logos/easy.svg",
      logoAlt: "easy",
      quote:
        "Supademo has been a huge asset across multiple departments and workflows across easy. We use Supademo across multiple departments, which cover all of our software solutions.",
      name: "Felix True",
      role: "Head of Presales",
      headshot: "https://supademo.com/headshots/felix-headshot.avif"
    },
    testimonialHeight: 574,
    popular: commonPopularModes[2],
    faq: [
      [
        "What are the benefits of using interactive demos for customer success?",
        "Customers get a clear answer they can revisit, while teams reduce repetitive calls and support work."
      ],
      [
        "How can customer success teams create product tutorials?",
        "Capture the workflow once, add concise guidance, and publish it wherever customers already learn."
      ],
      [
        "How can interactive demos improve product adoption?",
        "A viewer can learn by doing, which makes the next feature or workflow easier to discover."
      ],
      [
        "How do you create a scalable customer onboarding experience?",
        "Use reusable chapters and contextual links so every customer sees the same high-quality path."
      ]
    ],
    faqHeight: 814
  },
  "product-onboarding": {
    label: "Onboarding",
    title: "Scale product-led onboarding with interactive demos",
    description: "Shorten time-to-value with intuitive onboarding that drives learning by doing.",
    heroImage: "https://supademo.com/images/hero-onboarding.avif",
    heroAlt: "Product onboarding hero",
    storyEmbed: "https://app.supademo.com/embed/cm5vgsluo027c3v0i7dduvd27",
    blueCards: [
      [
        "Welcome experiences",
        "Start every new user with a focused path that makes the first success obvious.",
        "https://supademo.com/images/cs-onboarding.avif"
      ],
      [
        "In-app tours",
        "Guide users inside the workflow without interrupting the work they came to do.",
        "https://supademo.com/images/cs-training.avif"
      ],
      [
        "Role-based paths",
        "Give each audience the context and actions that fit their job to be done.",
        "https://supademo.com/images/cs-knowledge-base.avif"
      ],
      [
        "New feature education",
        "Make product updates easy to understand and easier to try.",
        "https://supademo.com/images/popular-usecase-04.avif"
      ]
    ].map(([title, description, image]) => ({ title, description, image, alt: title })),
    blueHeight: 624,
    testimonial: {
      logo: "https://supademo.com/logos/easy.svg",
      logoAlt: "easy",
      quote:
        "Supademo has been a huge asset across multiple departments and workflows across easy. We use Supademo across multiple departments, which cover all of our software solutions.",
      name: "Felix True",
      role: "Head of Presales",
      headshot: "https://supademo.com/headshots/felix-headshot.avif"
    },
    testimonialHeight: 614,
    popular: commonPopularModes[3],
    faq: [
      [
        "How can interactive demos improve product onboarding?",
        "They make each task hands-on and keep the next action visible at the moment a user needs it."
      ],
      [
        "What makes a good onboarding experience?",
        "A clear first action, short guidance, relevant examples, and a path to the next useful outcome."
      ],
      [
        "Can onboarding demos be embedded in an app?",
        "Yes. Use contextual links and in-app tours to put guidance alongside the real workflow."
      ],
      [
        "How do teams measure onboarding success?",
        "Track completion, engagement, feature adoption, and the time it takes users to reach value."
      ]
    ],
    faqHeight: 801
  },
  product: {
    label: "Product",
    title: "Test products and iterate faster with interactive demos",
    description:
      "Align teams on feature updates, validate workflows, and share product direction with confidence.",
    heroImage: "https://supademo.com/images/hero-product.avif",
    heroAlt: "Product workflow hero",
    statsTitle: "Test products and iterate with confidence",
    stats: [
      ["48%", "Faster feedback loops"],
      ["3x", "More test participants"],
      ["26%", "Fewer support gaps"]
    ],
    blueCards: [
      [
        "Rapid Prototyping",
        "Bring ideas to life in a tangible, quicker, interactive format early in the development process.",
        "https://supademo.com/images/scale-07.avif"
      ],
      [
        "Product Validation and Feedback",
        "Get early feedback on feature desirability, usability, and overall appeal with mock interactive demos.",
        "https://supademo.com/images/hero-product.avif"
      ],
      [
        "A/B Testing and Experimentation",
        "Create multiple versions to gather feedback and make data-driven decisions.",
        "https://supademo.com/images/scale-04.avif"
      ],
      [
        "Align teams on feature updates",
        "Build a shared best practice of the latest features, product updates, and interactive content.",
        "https://supademo.com/images/scale-03.avif"
      ]
    ].map(([title, description, image]) => ({ title, description, image, alt: title })),
    blueHeight: 656,
    testimonial: {
      logo: "https://supademo.com/logos/easy.svg",
      logoAlt: "easy",
      quote:
        "Supademo has been a huge asset across multiple departments and workflows across easy. We use Supademo across multiple departments, which cover all of our software solutions.",
      name: "Felix True",
      role: "Head of Presales",
      headshot: "https://supademo.com/headshots/felix-headshot.avif"
    },
    testimonialHeight: 614,
    popular: commonPopularModes[5],
    faq: [
      [
        "How do you validate a product or feature?",
        "Test prototypes with target users, analyze the signals, and gather feedback before committing to a build."
      ],
      [
        "What is the purpose of product validation?",
        "Product validation ensures you are building something users actually want and need."
      ],
      [
        "How should you gather product feedback from users?",
        "Use interviews, surveys, usability tests, and mock interactive demos to make feedback concrete."
      ],
      [
        "What are the steps to create a product roadmap?",
        "Align on the problem, prioritize evidence, define outcomes, and share the path with the team."
      ],
      [
        "What are the benefits of using an interactive demo tool like Supademo for product validation?",
        "Teams can share a realistic workflow before development and learn from real behavior sooner."
      ]
    ],
    faqHeight: 827
  },
  "education-training": {
    label: "Training",
    title: "Accelerate employee training with interactive demos",
    description:
      "Empower your staff with guided walkthroughs embedded within your existing training and internal docs with Supademo",
    heroImage: "https://supademo.com/images/hero-training.avif",
    heroAlt: "Training and education hero",
    statsTitle: "Transform training and education with Supademo",
    stats: [
      ["75%", "Faster tutorial creation"],
      ["52%", "Higher engagement"],
      ["3x", "Increase in workflow retention"]
    ],
    storyEmbed: "https://app.supademo.com/embed/cm5vorkch04kr3v0i6gatfni3",
    blueCards: [
      [
        "Employee Onboarding",
        "Accelerate new hire productivity with guides that demonstrate systems, processes, and tools.",
        "https://supademo.com/images/cs-onboarding.avif"
      ],
      [
        "Training and SOPs",
        "Transform traditional SOPs into engaging, interactive experiences with higher completion rates.",
        "https://supademo.com/images/cs-training.avif"
      ],
      [
        "Scale Institutional Knowledge",
        "Capture expert knowledge and preserve workflows so best practices stay accessible.",
        "https://supademo.com/images/cs-knowledge-base.avif"
      ],
      [
        "Scale self-serve guidance",
        "Embed Supademos throughout support docs, product guides, and onboarding.",
        "https://supademo.com/images/popular-usecase-04.avif"
      ]
    ].map(([title, description, image]) => ({ title, description, image, alt: title })),
    blueHeight: 624,
    testimonial: {
      logo: "https://supademo.com/logos/easy.svg",
      logoAlt: "easy",
      quote:
        "Supademo has been a huge asset across multiple departments and workflows across easy. We use Supademo across multiple departments, which cover all of our software solutions.",
      name: "Felix True",
      role: "Head of Presales",
      headshot: "https://supademo.com/headshots/felix-headshot.avif"
    },
    testimonialHeight: 614,
    popular: commonPopularModes[6],
    faq: [
      [
        "How do you create effective training materials?",
        "Identify learning objectives, keep the story concise, add interactive elements, and update the path as workflows change."
      ],
      [
        "What are SOPs and why are they important?",
        "Standard Operating Procedures provide consistent, high-quality instructions and efficient knowledge transfer."
      ],
      [
        "How can interactive demos improve employee training?",
        "They provide hands-on learning and make the correct workflow easy to repeat."
      ],
      [
        "What are the benefits of using Supademo for employee training?",
        "Teams publish faster, keep training current, and give every learner a path they can revisit."
      ]
    ],
    faqHeight: 708
  },
  "customer-support": {
    label: "Support",
    title: "Reduce support burden with interactive product demos",
    description: "Educate customers through embeddable tutorials that encourage learning by doing.",
    heroImage: "https://supademo.com/images/hero-support.avif",
    heroAlt: "Customer support hero",
    blueCards: [
      [
        "Email ticketing support",
        "Respond to customer inquiries with guided interactive demos to visually illustrate solutions or product functionality.",
        "https://supademo.com/images/cs-training.avif"
      ],
      [
        "Chatbots and embeds",
        "Allow customers to experience product features or troubleshooting steps in a conversational, interactive manner.",
        "https://supademo.com/images/cs-onboarding.avif"
      ],
      [
        "Knowledge base & help center",
        "Provide visual, hands-on product walkthroughs that enhance self-paced learning and reduce support burden.",
        "https://supademo.com/images/cs-knowledge-base.avif"
      ],
      [
        "Scale self-serve guidance",
        "Embed Supademos throughout support docs, product guides and onboarding to reduce support tickets.",
        "https://supademo.com/images/popular-usecase-04.avif"
      ]
    ].map(([title, description, image]) => ({ title, description, image, alt: title })),
    blueHeight: 624,
    testimonial: {
      logo: "https://supademo.com/logos/easy.svg",
      logoAlt: "easy",
      quote:
        "Supademo has been a huge asset across multiple departments and workflows across easy. We use Supademo across multiple departments, which cover all of our software solutions.",
      name: "Felix True",
      role: "Head of Presales",
      headshot: "https://supademo.com/headshots/felix-headshot.avif"
    },
    testimonialHeight: 614,
    popular: commonPopularModes[4],
    faq: [
      [
        "How to make a good product tutorial video?",
        "Plan content thoroughly, show and tell, keep it concise, and include clear annotations and audio."
      ],
      [
        "What tools are popular for customer support?",
        "Popular tools include help desks, live chat, knowledge bases, screen sharing, and interactive demos."
      ],
      [
        "How do you create a product training demo?",
        "Define the learning objective, outline the steps, and create an interactive path that shows the solution."
      ],
      [
        "What are the benefits of using an interactive demo tool like Supademo for customer support?",
        "Customers get immediate, visual answers while support teams scale guidance and reduce repetitive tickets."
      ]
    ],
    faqHeight: 735
  }
};

export function getUseCaseDetail(slug: string): UseCaseDetail | null {
  return details[slug] ?? null;
}

export function getUseCaseDetailMetadata(slug: string) {
  const detail = getUseCaseDetail(slug);
  return detail
    ? { title: `${detail.title} | Supademo`, description: detail.description }
    : { title: "Supademo use cases", description: "Interactive product demos for every team." };
}

function ReferenceImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
  return (
    <img className={className} src={src} alt={alt} loading="lazy" referrerPolicy="no-referrer" />
  );
}

export function MarketingUseCaseDetail({ slug }: { slug: string }) {
  const detail = getUseCaseDetail(slug) ?? details["sales-enablement"];
  const useCaseModes = commonPopularModes;
  const quoteParts = detail.testimonial.quote.split(". ");

  return (
    <main className={`use-case-detail-page use-case-detail-${slug}`} id="main">
      <MarketingHeader />

      <section className="use-case-detail-hero" aria-labelledby="use-case-detail-title">
        <div className="use-case-detail-hero-inner">
          <div className="use-case-detail-copy">
            <h1 id="use-case-detail-title">{detail.title}</h1>
            <p>{detail.description}</p>
            <div className="use-case-detail-actions">
              <a className="marketing-button" href="/signup">
                Create your first Supademo <span aria-hidden="true">→</span>
              </a>
              <a className="marketing-button marketing-button-outline" href="/product-demo">
                Request a demo
              </a>
            </div>
          </div>
          <div
            className="use-case-detail-hero-media"
            aria-label={`${detail.label} product demo preview`}
            role="img"
          >
            <ReferenceImage src={detail.heroImage} alt={detail.heroAlt} />
          </div>
        </div>
      </section>

      <section className="use-case-detail-trust" aria-labelledby="use-case-detail-trust-title">
        <div className="use-case-detail-trust-inner">
          <div className="use-case-detail-trust-heading">
            <h2 id="use-case-detail-trust-title">
              Trusted by 200,000+ top operators and 3,000+ paying organizations
            </h2>
          </div>
          <div className="use-case-detail-trust-badges" aria-label="Supademo awards">
            <ReferenceImage
              src="https://supademo.com/images/supademo-rating-03.webp"
              alt="Supademo awards and ratings"
            />
            <ReferenceImage
              src="https://supademo.com/images/supademo-rating-02.webp"
              alt="Supademo awards and ratings"
            />
          </div>
          <UseCaseTrustExplorer />
          <div className="use-case-detail-trust-logos" aria-label="Companies that trust Supademo">
            {[
              ["Spare", "https://supademo.com/logos/spare.svg"],
              ["Jotform", "https://supademo.com/logos/jotform.svg"],
              ["Anvil", "https://supademo.com/logos/useanvil.svg"],
              ["Beehiiv", "https://supademo.com/logos/beehiiv.avif"],
              ["Ledger", "https://supademo.com/logos/ledger-logo.svg"],
              ["Visma", "https://supademo.com/logos/visma.avif"],
              ["Lightspeed", "https://supademo.com/logos/lightspeed.svg"],
              ["EngDB", "https://supademo.com/logos/engdb.svg"],
              ["Relevance AI", "https://supademo.com/logos/relevanceai.svg"],
              ["Easy", "https://supademo.com/logos/easy.svg"],
              ["Alibaba", "https://supademo.com/logos/alibaba.avif"],
              ["Bullhorn", "https://supademo.com/logos/bullhorn.svg"],
              ["Typeform", "https://supademo.com/logos/typeform.svg"],
              ["NetApp", "https://supademo.com/logos/netapp.svg"],
              ["RB2B", "https://supademo.com/logos/rb2b.svg"],
              ["Turo", "https://supademo.com/logos/turo.avif"],
              ["Concentrix", "https://supademo.com/logos/concentrix.svg"],
              ["VRIFY", "https://supademo.com/logos/vrify.svg"],
              ["Posh", "https://supademo.com/logos/poshvip.svg"],
              ["Siemens", "https://supademo.com/logos/simens.svg"]
            ].map(([name, src]) => (
              <span key={name}>
                <ReferenceImage src={src} alt={`${name} Logo`} />
              </span>
            ))}
          </div>
        </div>
      </section>

      {detail.storyEmbed ? (
        <section className="use-case-detail-story" aria-label="Interactive Supademo example">
          <div className="use-case-detail-story-frame">
            <iframe
              title="Interactive Supademo"
              src={detail.storyEmbed}
              loading="lazy"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms"
              referrerPolicy="no-referrer"
            />
          </div>
        </section>
      ) : null}

      {detail.stats ? (
        <section className="use-case-detail-stats" aria-labelledby="use-case-detail-stats-title">
          <div className="use-case-detail-stats-inner">
            <h2 id="use-case-detail-stats-title">{detail.statsTitle}</h2>
            <div className="use-case-detail-stat-grid">
              {detail.stats.map(([value, label]) => (
                <div key={label}>
                  <strong>{value}</strong>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="use-case-detail-scale" aria-labelledby="use-case-detail-scale-title">
        <ReferenceImage
          className="use-case-detail-scale-illustration"
          src="https://supademo.com/_next/static/media/features-illustration.0x3mde-e47dm2.svg"
          alt=""
        />
        <div className="use-case-detail-scale-heading">
          <h2 id="use-case-detail-scale-title">Scale how your team demonstrates products</h2>
          <p>
            Drive conversions by personalizing your product demo with dynamic variables, conditional
            branching, custom branding and demo chapters.
          </p>
        </div>
        <UseCaseScaleRail cards={scaleCards} />
      </section>

      <section className="use-case-detail-blue-cards" aria-label={`${detail.label} use cases`}>
        <div className="use-case-detail-blue-grid">
          {detail.blueCards.map((card) => (
            <article key={card.title}>
              <div>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
              </div>
              <ReferenceImage src={card.image} alt={card.alt} />
            </article>
          ))}
        </div>
      </section>

      <section
        className="use-case-detail-testimonial"
        aria-label={`${detail.label} customer story`}
      >
        <div className="use-case-detail-testimonial-card">
          <ReferenceImage src={detail.testimonial.logo} alt={detail.testimonial.logoAlt} />
          <blockquote>
            “<span>{quoteParts[0]}</span>
            {quoteParts.length > 1 ? `. ${quoteParts.slice(1).join(". ")}` : ""}”
          </blockquote>
          <div className="use-case-detail-testimonial-person">
            {detail.testimonial.headshot ? (
              <ReferenceImage
                src={detail.testimonial.headshot}
                alt={`${detail.testimonial.name} photo`}
              />
            ) : null}
            <div>
              <strong>{detail.testimonial.name}</strong>
              <span>{detail.testimonial.role}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="use-case-detail-popular" aria-labelledby="use-case-detail-popular-title">
        <div className="use-case-detail-popular-inner">
          <h2 id="use-case-detail-popular-title">
            Powerful uses cases for every team at your company
          </h2>
          <UseCasePopularPanel modes={useCaseModes} initialLabel={detail.popular.label} />
        </div>
      </section>

      <section className="use-case-detail-faq" aria-labelledby="use-case-detail-faq-title">
        <div className="use-case-detail-faq-inner">
          <div className="use-case-detail-faq-copy">
            <h2 id="use-case-detail-faq-title">FAQs</h2>
            <p>
              Commonly asked questions about Supademo. Have other questions? Reach out and our team
              will be happy to help.
            </p>
          </div>
          <div className="use-case-detail-faq-list">
            {detail.faq.map(([question, answer]) => (
              <details key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
          <ReferenceImage
            className="use-case-detail-faq-art"
            src="https://supademo.com/images/faq-section-illustration.avif"
            alt="FAQ illustration"
          />
        </div>
      </section>

      <MarketingFooter variant="showcase" />
    </main>
  );
}
