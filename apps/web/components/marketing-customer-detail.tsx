import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

export type CustomerDetail = {
  company: string;
  category: string;
  title: string;
  description: string;
  heroImage?: string;
  quote: string;
  person: string;
  role: string;
  result: string;
  uses: readonly string[];
  accent: "blue" | "purple" | "teal" | "orange" | "green";
};

type CustomerNarrative = {
  aboutHeading: string;
  aboutPoints?: readonly string[];
  challengeHeading: string;
  challengePoints: readonly string[];
  solutionHeading: string;
  solutionPoints: readonly string[];
  resultsHeading: string;
  resultPoints: readonly string[];
  nextHeading?: string;
  faqQuestions: readonly string[];
};

const defaultFaqQuestions = [
  "How did the team get started?",
  "What changed for the audience?",
  "How does the team keep content current?",
  "Can other teams use the same approach?",
  "How quickly can teams create a new demo?",
  "Can the same demo be shared across departments?"
] as const;

const customerNarratives: Record<string, CustomerNarrative> = {
  bullhorn: {
    aboutHeading: "About Bullhorn",
    aboutPoints: ["What is Bullhorn?"],
    challengeHeading: "What challenges did Bullhorn face before Supademo?",
    challengePoints: ["Video-based learning bottlenecks"],
    solutionHeading: "Why did Bullhorn choose Supademo as their demo automation solution?",
    solutionPoints: [
      "eLearning and LMS training",
      "Product documentation",
      "HTML interactive demos and sandbox demo environments"
    ],
    resultsHeading: "What results has Bullhorn achieved with Supademo?",
    resultPoints: [
      "Time & workflow efficiency",
      "Improved learning outcomes",
      "Internal adoption and stakeholder trust"
    ],
    nextHeading: "What's next?",
    faqQuestions: [
      "How do recruitment and staffing companies use interactive demos for LMS training?",
      "What results did Bullhorn achieve by switching from video-based training to interactive demos?",
      "Can interactive demos be embedded into SCORM-compatible eLearning courses?",
      "How do sandbox demo environments improve enterprise software training?",
      "What is the best way to create scalable product documentation without engineering support?",
      "How can enterprise companies scale interactive training across global offices?"
    ]
  },
  vrify: {
    aboutHeading: "About VRIFY",
    challengeHeading: "What challenges did VRIFY face before Supademo?",
    challengePoints: [],
    solutionHeading: "Why did VRIFY choose Supademo as their interactive demo platform?",
    solutionPoints: [
      "How does VRIFY use Supademo?",
      "What Supademo features does VRIFY like the most?"
    ],
    resultsHeading: "What results has VRIFY achieved with Supademo?",
    resultPoints: [],
    nextHeading: "What's next?",
    faqQuestions: [
      "How did VRIFY reduce enablement content production time by 75%?",
      "How do mining and GeoTech companies use interactive demos for training?",
      "Can interactive demos be exported as videos for knowledge base libraries?",
      "How do interactive demos help growing companies avoid hiring additional training staff?",
      "What does the auto-zoom feature do in interactive product demos?",
      "What is the ROI of interactive demos for companies considering additional content hires?"
    ]
  },
  revio: {
    aboutHeading: "About Rev.io",
    challengeHeading: "What challenges did Rev.io face before Supademo?",
    challengePoints: [],
    solutionHeading: "Why did Rev.io choose Supademo as their interactive training platform?",
    solutionPoints: [],
    resultsHeading: "What results has Rev.io achieved with Supademo?",
    resultPoints: [],
    nextHeading: "What's next?",
    faqQuestions: [
      "How did Rev.io maintain training output with a 50% smaller team?",
      "How do modular demo steps eliminate the need to re-record training videos?",
      "What makes AI voiceovers better than manual voice recording for SaaS training?",
      "How does Rev.io use the Copy Steps feature for documentation?",
      "How can SaaS billing companies scale knowledge management with fewer resources?",
      "How do modular demo updates help teams keep documentation current with frequent product changes?"
    ]
  },
  spare: {
    aboutHeading: "About Spare Labs",
    challengeHeading: "Challenges and problems faced by Spare",
    challengePoints: [],
    solutionHeading: "The solution: leveraging Supademo for demo automation",
    solutionPoints: [],
    resultsHeading: "Results and outcomes from Supademo",
    resultPoints: [],
    faqQuestions: [
      "How does Spare use interactive demos across pre-sales and solutions engineering?",
      "How much deal value has Spare accelerated through demo automation?",
      "Why did Spare switch from Loom to Supademo for product demos?",
      "How do AI annotations and translations help mobility companies sell globally?",
      "How do trackable demo links help transit tech companies identify sales opportunities?",
      "How do product teams use interactive demos to communicate new features internally?"
    ]
  },
  orbitax: {
    aboutHeading: "About Orbitax",
    challengeHeading: "The Challenges",
    challengePoints: [],
    solutionHeading: "The Solution",
    solutionPoints: ["Adoption and Use Cases"],
    resultsHeading: "The Outcomes",
    resultPoints: [],
    faqQuestions: [
      "How do tax technology companies use interactive demos for global sales?",
      "How does Orbitax save dozens of hours each month with demo automation?",
      "How do AI translations help SaaS companies sell across multiple languages?",
      "What is the best way to empower sales champions with product demos?",
      "How do Showcases and Chapters help organize complex product demos?",
      "How do multilingual interactive demos help empower champions in enterprise sales cycles?"
    ]
  },
  greenpeace: {
    aboutHeading: "About Greenpeace CEE",
    challengeHeading: "What challenges did Greenpeace CEE face before Supademo?",
    challengePoints: [],
    solutionHeading:
      "Why did Greenpeace CEE choose Supademo as their internal tool adoption platform?",
    solutionPoints: ["How does Greenpeace CEE use Supademo?"],
    resultsHeading: "What results has Greenpeace CEE achieved with Supademo?",
    resultPoints: [],
    nextHeading: "What's next?",
    faqQuestions: [
      "How do nonprofits use interactive demos for internal tool training?",
      "How much IT support time can interactive demos save for organizations?",
      "What should organizations look for in a digital adoption platform for internal training?",
      "How do interactive tutorials improve digital literacy across distributed teams?",
      "Can interactive demos be embedded into GitBook or other knowledge base platforms?",
      "How can nonprofits use interactive demos to scale training across volunteer networks?"
    ]
  },
  "easy-software": {
    aboutHeading: "About Easy Software",
    challengeHeading: "The Challenges",
    challengePoints: [],
    solutionHeading: "The Solution",
    solutionPoints: [],
    resultsHeading: "Results",
    resultPoints: [],
    faqQuestions: [
      "How does Easy Software use interactive demos to close enterprise deals?",
      "How much time can sales reps save with demo automation in pre-sales?",
      "Can interactive demos be used at trade shows instead of looping videos?",
      "How do demo libraries help enterprise sales teams stay organized?",
      "What makes gated interactive demos effective for lead generation?",
      "How do enterprise teams share demos across departments without duplicating work?"
    ]
  },
  beehiiv: {
    aboutHeading: "About beehiiv",
    challengeHeading: "The Challenges",
    challengePoints: [],
    solutionHeading: "The Solution",
    solutionPoints: [],
    resultsHeading: "Results",
    resultPoints: [],
    faqQuestions: [
      "How does beehiiv use interactive demos to drive signups?",
      "What conversion rates do interactive demos achieve compared to video?",
      "How can SaaS companies use demo gating to qualify leads?",
      "How do newsletter and media companies benefit from interactive product demos?",
      "What is a multi-demo showcase and when should you use one?",
      "How do interactive demos reduce reliance on sales teams for SaaS signups?"
    ]
  }
};

const fallbackNarrative: CustomerNarrative = {
  aboutHeading: "About this customer",
  challengeHeading: "The Challenges",
  challengePoints: [],
  solutionHeading: "The Solution",
  solutionPoints: [],
  resultsHeading: "Results",
  resultPoints: [],
  faqQuestions: defaultFaqQuestions
};

function getCustomerNarrative(slug: string): CustomerNarrative {
  const canonicalSlug = slug.replace(/-case-study$/u, "");
  return customerNarratives[slug] ?? customerNarratives[canonicalSlug] ?? fallbackNarrative;
}

const customerDetails: Record<string, CustomerDetail> = {
  "vrify-case-study": {
    company: "VRIFY",
    category: "Product enablement",
    title: "How VRIFY reduced enablement content production time by 75%",
    description:
      "Learn how VRIFY used on-demand interactive demos to reduce production time by 75%, avoid unnecessary hiring, while delivering a more engaging scalable demo experience for customers.",
    quote: "Supademo has allowed us to rapidly increase our onboarding and knowledge creation.",
    person: "Nova Siegmann",
    role: "Sr. Manager, Product Enablement",
    result: "3x more reusable product education",
    uses: ["New-hire onboarding", "Release education", "Internal enablement"],
    accent: "purple"
  },
  "bullhorn-case-study": {
    company: "Bullhorn",
    category: "Sales enablement",
    title: "How Bullhorn accelerates training and documentation with interactive demos",
    description:
      "Discover how Bullhorn's Instructional Design and Product Documentation teams replaced videos with interactive demos, increasing learner engagement by 20%.",
    quote:
      "Supademo helps our teams show the product clearly across every department and workflow.",
    person: "Robert Fox",
    role: "Instructional Design Lead",
    result: "50% faster sales content production",
    uses: ["Sales follow-ups", "Feature launches", "Rep onboarding"],
    accent: "orange"
  },
  "beehiiv-case-study": {
    company: "beehiiv",
    category: "Growth",
    title: "beehiiv converts 50% better with Supademo",
    description:
      "Learn how beehiiv leverages Supademo to turn demo viewers into signups, while dramatically increasing free-to-paid conversions.",
    quote: "We've driven several thousand signups through our demo experience so far.",
    person: "EJ White",
    role: "Head of Growth",
    result: "2x faster demo production",
    uses: ["Product-led campaigns", "Customer onboarding", "Launch follow-ups"],
    accent: "green"
  },
  "easy-software-case-study": {
    company: "Easy Software",
    category: "Sales & enablement",
    title: "How Easy uses interactive demos to enhance pre-sales workflow",
    description:
      "Learn how one of Germany's leading software companies drives ROI across multiple departments with Supademo.",
    quote:
      "Supademo has been a huge asset across multiple departments and workflows across Easy Software.",
    person: "Felix True",
    role: "Head of Presales",
    result: "$100k+ in contracts closed",
    uses: ["Presales", "Customer education", "Product marketing"],
    accent: "blue"
  },
  orbitax: {
    company: "Orbitax",
    category: "Product marketing",
    title: "Orbitax closes global deals with Supademo",
    description:
      "Learn how Orbitax, a global tax technology company, leverages Supademo as a demo automation platform to prospect, qualify, and close clients across 195 jurisdictions.",
    quote: "Supademo lets us show the value of a complicated product before the first meeting.",
    person: "Orbitax team",
    role: "Product marketing",
    result: "80% less time spent preparing demos",
    uses: ["Feature discovery", "Campaign landing pages", "Sales handoffs"],
    accent: "teal"
  },
  spare: {
    company: "Spare",
    category: "Customer success",
    title: "Delivering massive impact across Spare's platform",
    description:
      "Discover how Spare leverages Supademo across solutions engineering, marketing, and internal communications to power over 20 million rides globally.",
    quote: "Supademo has become an invaluable part of various workflows at Spare.",
    person: "Kristoffer Vik Hansen",
    role: "Co-founder & CEO",
    result: "75% faster content production",
    uses: ["Customer onboarding", "Support deflection", "Team training"],
    accent: "purple"
  },
  "easy-software": {
    company: "Easy Software",
    category: "Sales enablement",
    title: "How Easy uses interactive demos to enhance pre-sales workflow",
    description:
      "Learn how one of Germany's leading software companies drives ROI across multiple departments with Supademo.",
    quote: "One clear demo gives every teammate a better starting point for the conversation.",
    person: "Easy Software team",
    role: "Revenue enablement",
    result: "80% faster content production",
    uses: ["Sales training", "Product launches", "Customer follow-ups"],
    accent: "blue"
  },
  beehiiv: {
    company: "beehiiv",
    category: "Product marketing",
    title: "beehiiv converts 50% better with Supademo",
    description:
      "Learn how beehiiv leverages Supademo to turn demo viewers into signups, while dramatically increasing free-to-paid conversions.",
    quote: "Our demos are now a key part of our lead generation strategy.",
    person: "EJ White",
    role: "Head of Growth",
    result: "20% increase in demo engagement",
    uses: ["Product updates", "Growth campaigns", "Self-serve onboarding"],
    accent: "green"
  },
  greenpeace: {
    company: "Greenpeace",
    category: "Customer education",
    title: "Greenpeace CEE saves support hours and scales digitalization with Supademo",
    description:
      "Learn how Greenpeace Central and Eastern Europe leverages Supademo to create interactive demos that enhance internal digitalization efforts and tool-based knowledge management.",
    quote: "Supademo helps us save hundreds of hours on demos and documentation.",
    person: "Greenpeace team",
    role: "Digital operations",
    result: "Hundreds of hours saved",
    uses: ["Volunteer onboarding", "Process documentation", "Internal guidance"],
    accent: "teal"
  },
  revio: {
    company: "Revio",
    category: "Sales enablement",
    title: "Rev.io creates training material in hours instead of weeks",
    description:
      "Learn how Rev.io cut training content production time from weeks to hours, maintained output with a 50% smaller team, and kept software documentation effortlessly up to date using Supademo.",
    quote: "Our team can share product knowledge without repeating the same walkthrough.",
    person: "Revio team",
    role: "Revenue operations",
    result: "4x more self-serve engagement",
    uses: ["Outbound follow-ups", "Qualification", "Customer onboarding"],
    accent: "orange"
  },
  bullhorn: {
    company: "Bullhorn",
    category: "Customer success",
    title: "How Bullhorn accelerates training and documentation with interactive demos",
    description:
      "Discover how Bullhorn's Instructional Design and Product Documentation teams replaced videos with interactive demos, increasing learner engagement by 20%.",
    quote: "The right demo makes the next task easier for every customer and teammate.",
    person: "Bullhorn team",
    role: "Customer success",
    result: "Faster time to value",
    uses: ["Customer onboarding", "Support education", "Renewal enablement"],
    accent: "orange"
  },
  vrify: {
    company: "VRIFY",
    category: "Product enablement",
    title: "How VRIFY reduced enablement content production time by 75%",
    description:
      "Learn how VRIFY used on-demand interactive demos to reduce production time by 75%, avoid unnecessary hiring, while delivering a more engaging scalable demo experience for customers.",
    quote: "A focused, reusable walkthrough keeps the entire organization aligned.",
    person: "VRIFY team",
    role: "Product enablement",
    result: "3x more reusable education",
    uses: ["New-hire onboarding", "Product updates", "Internal enablement"],
    accent: "purple"
  }
};

const customerHeroImages: Record<string, string> = {
  "vrify-case-study": "https://supademo.com/case-studies/vrify-header.avif",
  "bullhorn-case-study": "https://supademo.com/case-studies/bullhorn-header-1.avif",
  "beehiiv-case-study": "https://supademo.com/case-studies/beehiiv-header.avif",
  "easy-software-case-study": "https://supademo.com/case-studies/easy-screenshot.avif",
  orbitax: "https://supademo.com/case-studies/orbitax-screen.avif",
  spare: "https://supademo.com/case-studies/spare-launch.webp",
  "easy-software": "https://supademo.com/case-studies/easy-screenshot.avif",
  beehiiv: "https://supademo.com/case-studies/beehiiv-header.avif",
  greenpeace: "https://supademo.com/case-studies/greenpeace-header.avif",
  revio: "https://supademo.com/case-studies/revio-header.avif",
  bullhorn: "https://supademo.com/case-studies/bullhorn-header-1.avif",
  vrify: "https://supademo.com/case-studies/vrify-header.avif"
};

const customerSupportingImages: Record<string, string> = {
  "beehiiv-case-study": "https://supademo.com/case-studies/beehiiv-showcase.avif",
  beehiiv: "https://supademo.com/case-studies/beehiiv-showcase.avif",
  "easy-software-case-study": "https://supademo.com/case-studies/easy-screenshot.avif",
  "easy-software": "https://supademo.com/case-studies/easy-screenshot.avif",
  "bullhorn-case-study": "https://supademo.com/case-studies/bullhorn-header-1.avif",
  bullhorn: "https://supademo.com/case-studies/bullhorn-header-1.avif",
  "vrify-case-study": "https://supademo.com/case-studies/vrify-header.avif",
  vrify: "https://supademo.com/case-studies/vrify-header.avif",
  orbitax: "https://supademo.com/case-studies/orbitax-screen.avif",
  spare: "https://supademo.com/case-studies/spare-launch.webp",
  greenpeace: "https://supademo.com/case-studies/greenpeace-header.avif",
  revio: "https://supademo.com/case-studies/revio-header.avif"
};

export function getCustomerDetail(slug: string): CustomerDetail | null {
  const detail = customerDetails[slug];
  return detail ? { ...detail, heroImage: detail.heroImage ?? customerHeroImages[slug] } : null;
}

export function getCustomerDetailMetadata(slug: string) {
  const detail = getCustomerDetail(slug);
  return detail
    ? { title: `${detail.company}: ${detail.title} | Supademo`, description: detail.description }
    : { title: "Customer story | Supademo", description: "See how teams use Supademo." };
}

function CustomerPreview({ detail }: { detail: CustomerDetail }) {
  return (
    <div
      className={`customer-detail-preview customer-detail-preview-${detail.accent}${detail.heroImage ? " customer-detail-preview-has-image" : ""}`}
      role="img"
      aria-label={`${detail.company} Supademo preview`}
    >
      <div className="customer-detail-preview-bar" aria-hidden="true">
        <span />
        <span />
        <span />
        <strong>{detail.company} / Product story</strong>
      </div>
      {detail.heroImage ? (
        <div className="customer-detail-preview-media" aria-hidden="true">
          <img
            className="customer-detail-preview-image"
            src={detail.heroImage}
            alt=""
            loading="eager"
            referrerPolicy="no-referrer"
          />
        </div>
      ) : null}
      {!detail.heroImage ? (
        <div className="customer-detail-preview-body">
          <aside>
            <b>{detail.company.slice(0, 1)}</b>
            <i />
            <i />
            <i />
          </aside>
          <section>
            <small>INTERACTIVE DEMO</small>
            <h2>{detail.result}</h2>
            <div className="customer-detail-preview-grid">
              <span />
              <span />
              <span />
              <span />
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

const vrifyFaqs = [
  [
    "How did VRIFY reduce enablement content production time by 75%?",
    "VRIFY replaced manual walkthrough creation with on-demand interactive demos that combine voice narration, auto-zoom functionality, and video export in a single platform. Product onboarding teams use this approach to eliminate manually stitching together screenshots, voiceovers, and video assets, cutting production time from hours per guide to minutes."
  ],
  [
    "How do mining and GeoTech companies use interactive demos for training?",
    "Mining companies like VRIFY use interactive demos to create how-to articles, conceptual guides, and customer onboarding resources for complex geoscience platforms. These self-paced walkthroughs, built with an AI-powered tutorial maker, let users learn technical workflows at their own speed while voice narration enhances clarity for specialized processes like AI-driven mineral exploration analysis."
  ],
  [
    "Can interactive demos be exported as videos for knowledge base libraries?",
    "Yes. VRIFY uses the demo-to-video export feature via the screen recorder to build a comprehensive repository of on-demand training content for their help center. This workflow captures voice narration, auto-zoom, and interactive pacing in a single recording, then converts it to video format for platforms that require traditional video embedding."
  ],
  [
    "How do interactive demos help growing companies avoid hiring additional training staff?",
    "VRIFY avoided hiring an additional full-time employee by using Supademo to meet growing content demand without increasing headcount, saving over $100k in staffing costs. The State of Interactive Demos 2026 report highlights how platforms like Supademo empower existing team members to produce professional-quality training content independently, scaling output without proportionally scaling the team."
  ],
  [
    "What does the auto-zoom feature do in interactive product demos?",
    "Auto-zoom provides precise focus on specific UI elements during walkthroughs, offering a polished, modern alternative to static highlight boxes. VRIFY cites this as a standout feature that makes their in-app training content more engaging and professional, especially when guiding users through detailed geoscience interfaces with many data-dense screens."
  ],
  [
    "What is the ROI of interactive demos for companies considering additional content hires?",
    "Interactive demo platforms can deliver the output of an additional full-time content producer at a fraction of the cost. VRIFY reduced production time by 75% and avoided hiring a dedicated content role entirely, redirecting that budget toward product development. Companies evaluating this tradeoff can use product demo video tools to estimate how much existing team members can produce before committing to new headcount."
  ]
] as const;

function VrifyCustomerStory() {
  return (
    <main className="customer-detail-page vrify-case-study-page" id="main">
      <MarketingHeader />
      <div className="vrify-case-study-top">
        <section className="vrify-case-study-hero" aria-labelledby="vrify-case-study-title">
          <nav className="vrify-case-study-breadcrumb" aria-label="Breadcrumb">
            <a href="/">Home</a>
            <span aria-hidden="true">›</span>
            <a href="/customers">Customers</a>
            <span aria-hidden="true">›</span>
            <span>VRIFY</span>
          </nav>
          <h1 id="vrify-case-study-title">
            How VRIFY reduced enablement content production time by 75%
          </h1>
          <p>
            Learn how VRIFY used on-demand interactive demos to reduce production time by 75%, avoid
            unnecessary hiring, while delivering a more engaging scalable demo experience for
            customers.
          </p>
          <div className="vrify-case-study-hero-media">
            <img
              src="https://supademo.com/case-studies/vrify-header.avif"
              alt="VRIFY demo showcase"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
        </section>

        <section className="vrify-case-study-stats" aria-label="VRIFY results at a glance">
          <article>
            <strong>75%</strong>
            <p>Enablement content production time reduction</p>
          </article>
          <article>
            <strong>$100k+</strong>
            <p>Savings on additional headcount and time savings</p>
          </article>
          <article>
            <strong>100+</strong>
            <p>conversion-focused interactive demos created</p>
          </article>
        </section>
      </div>

      <section className="vrify-case-study-profile" aria-label="VRIFY company profile">
        <div className="vrify-case-study-profile-card">
          <dl>
            <div>
              <dt>Company size</dt>
              <dd>100+ employees, Series B</dd>
            </div>
            <div>
              <dt>Use Cases</dt>
              <dd>Onboarding, training, knowledge base, sales enablement</dd>
            </div>
            <div>
              <dt>Challenges</dt>
              <dd>Time-consuming manual walkthroughs, fragmented tooling, limited scalability</dd>
            </div>
            <div>
              <dt>Outcomes</dt>
              <dd>75% faster production, zero additional hires, higher engagement</dd>
            </div>
          </dl>
          <div className="vrify-case-study-profile-quote">
            <img
              src="https://supademo.com/logos/vrify.svg"
              alt="VRIFY logo small"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
            <blockquote>
              “Supademo is a fantastic product that has allowed us to rapidly increase our
              onboarding and knowledge creation at VRIFY, which is key to our rapidly expanding
              product. Alongside their product being both technically advanced and easy to use,
              their team makes the experience even better.”
            </blockquote>
            <div className="vrify-case-study-person">
              <img
                src="https://supademo.com/case-studies/nova-headshot.avif"
                alt="Nova Siegmann"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <span>
                <strong>Nova Siegmann</strong>
                <small>Sr. Manager, Product Enablement &amp; Training</small>
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="vrify-case-study-content">
        <section
          className="vrify-story-block vrify-story-about"
          aria-labelledby="vrify-about-title"
        >
          <h2 id="vrify-about-title">About VRIFY</h2>
          <p>
            VRIFY empowers geoscience teams with proprietary AI that rapidly identifies
            high-potential targets and uncovers areas of potential mineralization through unbiased
            data analysis, accelerating discovery and decision-making. Combined with advanced
            visualization tools, their team has created a platform for the mineral exploration
            industry that is transforming the future of discovery.
          </p>
          <p>
            A high-growth Series B software company trusted by hundreds of organizations worldwide,
            VRIFY is not just leading innovation in mineral exploration but creating a new category.
            By making AI accessible and easy to understand, VRIFY empowers the mineral exploration
            industry to unlock the full value of their data, from greenfield to production, and
            drive high-confidence exploration strategies.
          </p>
        </section>

        <section
          className="vrify-story-block vrify-story-challenge"
          aria-labelledby="vrify-challenge-title"
        >
          <h2 id="vrify-challenge-title">What challenges did VRIFY face before Supademo?</h2>
          <p>
            Before adopting Supademo, the team needed far more than a basic interactive demo tool.
            They needed a solution that could:
          </p>
          <ul>
            <li>
              <strong>Go beyond simple interactive demos:</strong> Add voiceovers and quickly
              convert demos into videos for use in the help center and an upcoming how-to video
              repository.
            </li>
            <li>
              <strong>Streamline technical walkthrough creation:</strong> Reduce the time and effort
              required from internal knowledge creators.
            </li>
            <li>
              <strong>Capture everything in one platform:</strong> Record voice, capture
              screenshots, and create interactive pacing without the need to manually stitch assets
              together.
            </li>
            <li>
              <strong>Deliver a self-guided client experience:</strong> Combine visuals and audio in
              a way that lets users move through content at their own pace.
            </li>
          </ul>
        </section>

        <section
          className="vrify-story-block vrify-story-solution"
          aria-labelledby="vrify-solution-title"
        >
          <h2 id="vrify-solution-title">
            Why did VRIFY choose Supademo as their interactive demo platform?
          </h2>
          <p>
            The team chose Supademo after evaluating alternatives and finding no other platform that
            combined all of their required features. Key reasons included:
          </p>
          <ul>
            <li>
              <strong>Delivering interactive, self-paced guided walkthroughs:</strong> Giving users
              an engaging way to learn at their own speed.
            </li>
            <li>
              <strong>Supporting voice narration:</strong> Enhancing clarity and accessibility in
              technical walkthroughs.
            </li>
            <li>
              <strong>Integrating seamlessly with existing workflows:</strong> Easily embedding
              demos into the knowledge base and client onboarding processes.
            </li>
            <li>
              <strong>Offering unmatched flexibility:</strong> Adapting to different use cases,
              including knowledge transfer and enablement, not just sales demos.
            </li>
            <li>
              <strong>Providing hands-on client success support:</strong> Working with an
              exceptionally helpful team that offers guidance and support rather than leaving
              customers to figure out workarounds on their own.
            </li>
          </ul>
          <div className="vrify-story-image">
            <img
              src="https://supademo.com/case-studies/vrify-product.avif"
              alt="VRIFY showcase with Supademo"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <blockquote className="vrify-story-inline-quote">
            <p>
              “We always look for partners who embrace innovation like we do at VRIFY, and it's
              clear this is important to the Supademo team, too. Their user support and easy-to-use
              product are truly a big win for our education and training content.”
            </p>
            <cite>
              <img
                src="https://supademo.com/case-studies/nova-headshot.avif"
                alt="Nova photo"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <span>
                <strong>Nova Siegmann</strong>
                <small>Sr. Manager, Product Enablement &amp; Training</small>
              </span>
            </cite>
          </blockquote>
        </section>

        <section className="vrify-story-block vrify-story-use" aria-labelledby="vrify-use-title">
          <h2 id="vrify-use-title">How does VRIFY use Supademo?</h2>
          <p>
            Supademo is used day-to-day by the Product Enablement team, supporting both external and
            internal audiences. Key use cases include:
          </p>
          <ul>
            <li>
              <strong>Creating how-to articles and conceptual guides:</strong> Enhance documentation
              with interactive, easy-to-follow resources.
            </li>
            <li>
              <strong>Customer onboarding:</strong> Equip new users with self-paced, visual training
              that reduces support dependency.
            </li>
            <li>
              <strong>Client and employee onboarding:</strong> Standardize and streamline training
              for both external clients and new team members.
            </li>
          </ul>
        </section>

        <section
          className="vrify-story-block vrify-story-features"
          aria-labelledby="vrify-features-title"
        >
          <h2 id="vrify-features-title">What Supademo features does VRIFY like the most?</h2>
          <ul>
            <li>
              <strong>Auto-zoom functionality:</strong> Provides precise focus on UI elements and
              offers a polished, modern alternative to static highlight boxes, making walkthroughs
              more engaging and professional.
            </li>
            <li>
              <strong>Seamless embedding:</strong> Integrates directly into onboarding materials and
              knowledge articles, improving accessibility for different learning styles.
            </li>
          </ul>
          <div className="vrify-story-image">
            <img
              src="https://supademo.com/case-studies/vrify-product-2.avif"
              alt="VRIFY tutorial example"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        </section>

        <section
          className="vrify-story-block vrify-story-results"
          aria-labelledby="vrify-results-title"
        >
          <h2 id="vrify-results-title">What results has VRIFY achieved with Supademo?</h2>
          <ul>
            <li>
              <strong>Cut production time by approximately 75%:</strong> Replaced manual walkthrough
              creation with on-demand Supademos, drastically accelerating content delivery.
            </li>
            <li>
              <strong>Avoided hiring an additional full-time employee:</strong> Met growing content
              demand without increasing headcount, saving significant staffing costs.
            </li>
            <li>
              <strong>Increased knowledge base engagement:</strong> Delivered a more engaging,
              elevated learning experience for clients, boosting usage and adoption.
            </li>
          </ul>
        </section>

        <section className="vrify-story-block vrify-story-next" aria-labelledby="vrify-next-title">
          <h2 id="vrify-next-title">What's next?</h2>
          <p>Looking ahead, the team plans to:</p>
          <ul>
            <li>
              <strong>Expand Supademo usage across training and enablement:</strong> Broaden
              adoption to cover more internal and client-facing initiatives.
            </li>
            <li>
              <strong>Build a comprehensive training video library:</strong> Use the demo-to-video
              feature to create an extensive repository of on-demand training content.
            </li>
            <li>
              <strong>Adopt Supademo across additional teams:</strong> Introduce the platform to
              other departments for onboarding and knowledge transfer.
            </li>
            <li>
              <strong>Leverage upcoming platform improvements:</strong> Take advantage of new
              features to make knowledge capture and delivery even faster and more effective.
            </li>
          </ul>
        </section>
      </div>

      <section className="vrify-case-study-faq" aria-labelledby="vrify-faq-title">
        <div className="vrify-case-study-faq-inner">
          <div className="vrify-case-study-faq-intro">
            <h2 id="vrify-faq-title">FAQs</h2>
            <p>
              Commonly asked questions about Supademo. Have other questions? Reach out and our team
              will be happy to help.
            </p>
            <img
              src="https://supademo.com/images/faq-section-illustration.avif"
              alt="FAQ illustration"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="vrify-case-study-faq-list">
            {vrifyFaqs.map(([question, answer], index) => (
              <details open={index === 0} key={question}>
                <summary>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
      <MarketingFooter variant="showcase" />
    </main>
  );
}

export function MarketingCustomerDetail({ slug }: { slug: string }) {
  if (slug === "vrify") return <VrifyCustomerStory />;
  const detail = getCustomerDetail(slug) ?? customerDetails.beehiiv;
  const narrative = getCustomerNarrative(slug);
  return (
    <main className={`customer-detail-page customer-detail-${slug}`} id="main">
      <MarketingHeader />
      <section className="customer-detail-hero" aria-labelledby="customer-detail-title">
        <div className="customer-detail-hero-copy">
          <p className="customer-detail-eyebrow">{detail.category}</p>
          <p className="customer-detail-breadcrumb">Customers / {detail.company}</p>
          <h1 id="customer-detail-title">{detail.title}</h1>
          <p>{detail.description}</p>
          <div className="customer-detail-author">
            <strong>{detail.person}</strong>
            <span>{detail.role}</span>
          </div>
          <div className="marketing-hero-actions">
            <a className="marketing-button" href="/signup">
              Create your first demo <span aria-hidden="true">→</span>
            </a>
            <a className="marketing-text-action" href="/customers">
              View all customer stories
            </a>
          </div>
        </div>
        <CustomerPreview detail={detail} />
      </section>

      <section className="customer-detail-about" aria-labelledby="customer-detail-about-title">
        <p className="customer-detail-eyebrow">About {detail.company}</p>
        <h2 id="customer-detail-about-title">{narrative.aboutHeading}</h2>
        <p className="customer-detail-about-lede">{detail.description}</p>
        {narrative.aboutPoints?.length ? (
          <div className="customer-detail-about-points">
            {narrative.aboutPoints.map((point) => (
              <h3 key={point}>{point}</h3>
            ))}
          </div>
        ) : null}
        <div className="customer-detail-use-grid">
          {detail.uses.map((use, index) => (
            <article key={use}>
              <span>0{index + 1}</span>
              <strong>{use}</strong>
              <p>Give the team a clear, reusable path through the product.</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="customer-detail-challenges"
        aria-labelledby="customer-detail-challenges-title"
      >
        <div className="customer-detail-section-heading">
          <p className="customer-detail-eyebrow">The challenge</p>
          <h2 id="customer-detail-challenges-title">{narrative.challengeHeading}</h2>
        </div>
        <div className="customer-detail-challenge-grid">
          {(narrative.challengePoints.length > 0
            ? narrative.challengePoints
            : [
                "Too much context lived in meetings.",
                "Content went stale too quickly.",
                "Viewers could not try the moment."
              ]
          ).map((heading, index) => (
            <article key={heading}>
              <span>0{index + 1}</span>
              {narrative.challengePoints.length > 0 ? (
                <h3>{heading}</h3>
              ) : (
                <strong>{heading}</strong>
              )}
              <p>
                Teams needed a consistent way to explain the product before a conversation started.
              </p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="customer-detail-solution"
        aria-labelledby="customer-detail-solution-title"
      >
        <div className="customer-detail-solution-art">
          <img
            src={customerSupportingImages[slug] ?? detail.heroImage ?? customerHeroImages.beehiiv}
            alt={`${detail.company} product demo`}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="customer-detail-solution-copy">
          <p className="customer-detail-eyebrow">The solution</p>
          <h2 id="customer-detail-solution-title">{narrative.solutionHeading}</h2>
          <p>
            With Supademo, {detail.company} can capture the product once, add the context that
            matters, and give every audience a link they can follow at their own pace.
          </p>
          {narrative.solutionPoints.length > 0 ? (
            <div className="customer-detail-solution-points">
              {narrative.solutionPoints.map((point) => (
                <h3 key={point}>{point}</h3>
              ))}
            </div>
          ) : null}
          <a className="marketing-text-action" href="/signup">
            Create your first demo <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <section className="customer-detail-results" aria-labelledby="customer-detail-results-title">
        <div className="customer-detail-section-heading">
          <p className="customer-detail-eyebrow">Results</p>
          <h2 id="customer-detail-results-title">{narrative.resultsHeading}</h2>
        </div>
        <div className="customer-detail-result-grid">
          {(narrative.resultPoints.length > 0
            ? narrative.resultPoints
            : [
                "Time saved across the workflow",
                "A source of truth for every team",
                "Self-serve product education"
              ]
          ).map((point, index) => (
            <article key={point}>
              <strong>
                {index === 0
                  ? detail.result.split(" ").slice(0, 2).join(" ")
                  : index === 1
                    ? "1"
                    : "24/7"}
              </strong>
              {narrative.resultPoints.length > 0 ? <h3>{point}</h3> : <span>{point}</span>}
            </article>
          ))}
        </div>
      </section>

      <section className="customer-detail-quote" aria-label={`${detail.company} quote`}>
        <blockquote>“{detail.quote}”</blockquote>
        <cite>
          <strong>{detail.person}</strong>
          <span>{detail.role}</span>
        </cite>
      </section>

      {narrative.nextHeading ? (
        <section className="customer-detail-next" aria-labelledby="customer-detail-next-title">
          <p className="customer-detail-eyebrow">Next steps</p>
          <h2 id="customer-detail-next-title">{narrative.nextHeading}</h2>
          <p>
            Keep the source of truth current, then reuse the same interactive story wherever your
            audience needs a clear next step.
          </p>
        </section>
      ) : null}

      <section className="customer-detail-faq" aria-labelledby="customer-detail-faq-title">
        <div className="customer-detail-faq-copy">
          <p className="customer-detail-eyebrow">Questions, answered</p>
          <h2 id="customer-detail-faq-title">FAQs</h2>
        </div>
        <div className="customer-detail-faq-list">
          {narrative.faqQuestions.map((question) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>
                Supademo gives teams a clear, reusable path through the product so people can learn
                at their own pace and return to the same source when the product changes.
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="customer-detail-cta" aria-labelledby="customer-detail-cta-title">
        <div>
          <p className="customer-detail-eyebrow">Show the work</p>
          <h2 id="customer-detail-cta-title">
            Make your next product explanation easier to share.
          </h2>
        </div>
        <a className="marketing-button marketing-button-light" href="/signup">
          Start for free <span aria-hidden="true">→</span>
        </a>
      </section>
      <MarketingFooter variant="showcase" />
    </main>
  );
}
