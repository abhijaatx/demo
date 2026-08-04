import { MarketingFooter, MarketingHeader } from "./marketing-chrome";
import { ToolDetailInteractions } from "./tool-detail-interactions";
import { ScreenshotEditorWorkbench } from "./tool-detail-workbench";

type ToolDetail = {
  name: string;
  title: string;
  description: string;
  cta: string;
  introTitle: string;
  storyTitle: string;
  storyDescription: string;
  featureItems: readonly [string, string][];
  steps?: readonly string[];
  useCaseTitle?: string;
  useCaseItems?: readonly string[];
  longformTitle?: string;
  faqQuestions?: readonly string[];
};

const toolDetails: Record<string, ToolDetail> = {
  "interactive-demo-builder": {
    name: "Interactive Demo Builder",
    title: "Free AI Interactive Demo Builder",
    description:
      "The free no-code interactive demo builder records any product flow and turns it into a clickable interactive demo with AI annotations, hotspots, and branching. Used by 100,000+ teams as their AI demo maker for sales, customer success, and product.",
    cta: "Try free interactive demo builder",
    introTitle: "How to build an interactive demo with Supademo",
    storyTitle: "What makes Supademo's interactive demo builder different",
    storyDescription:
      "Capture a workflow once, then turn it into a polished, guided experience your audience can explore at their own pace.",
    featureItems: [
      [
        "AI captures and annotates as you click",
        "Let AI add context while you record the product flow."
      ],
      [
        "Branching paths let viewers choose their own journey",
        "Give every audience a focused route through the product."
      ],
      [
        "Analytics that show exactly where buyers engage or drop off",
        "Know which steps create momentum and which need refinement."
      ]
    ],
    useCaseItems: [
      "How do sales teams use interactive demo builders?",
      "How do marketing teams use interactive demo builders?",
      "How do CS teams use interactive demo builders?",
      "How do support teams use interactive demo builders?",
      "How do product teams use interactive demo builders?",
      "How do training teams use interactive demo builders?"
    ]
  },
  "interactive-walkthrough-builder": {
    name: "Interactive Walkthrough Builder",
    title: "Free AI Interactive Walkthrough Builder",
    description:
      "Build interactive product walkthroughs to share as a link or embed. Supademo creates guided steps while you click, so teams can teach the workflow without a live call.",
    cta: "Try free interactive walkthrough builder",
    introTitle: "How to create an interactive walkthrough with Supademo",
    storyTitle: "What makes Supademo's interactive walkthrough builder different",
    storyDescription:
      "Create walkthroughs that work outside your product, not just inside it, and send them wherever your audience already learns.",
    featureItems: [
      [
        "Works outside your product, not just inside it",
        "Share one focused link in docs, campaigns, or follow-ups."
      ],
      [
        "AI generates the content while you click",
        "Turn product actions into useful, readable guidance."
      ],
      ["Analytics show where users get stuck", "Use engagement data to improve every walkthrough."]
    ]
  },
  "product-demo-video-maker": {
    name: "Product Demo Video Maker",
    title: "Free AI Product Demo Video Maker",
    description:
      "Record a crisp product video with voice, webcam, and chapters, then share a focused story that helps viewers understand what matters.",
    cta: "Try free product demo video maker",
    introTitle: "How to make a product demo video with Supademo",
    storyTitle: "A product video that stays useful after launch day",
    storyDescription:
      "Keep the take concise, add context where it matters, and publish a video your team can revisit in every channel.",
    featureItems: [
      [
        "Record with voice and webcam",
        "Give the product a human explanation without a separate editing suite."
      ],
      [
        "Add chapters and calls to action",
        "Help viewers skip to the moment they need and keep moving."
      ],
      [
        "Share as a link or embed",
        "Put the same polished video in follow-ups, docs, and campaigns."
      ]
    ]
  },
  "screen-recorder": {
    name: "Screen Recorder",
    title: "Free Online Screen Recorder",
    description:
      "Capture a workflow, webcam, or voiceover in one take, then turn it into a clear product explanation your team can share.",
    cta: "Try free screen recorder",
    introTitle: "How to record your screen with Supademo",
    storyTitle: "A recorder built for useful product moments",
    storyDescription:
      "Pause, undo, redact, and finish with a focused take instead of a long recording that leaves viewers searching for the point.",
    featureItems: [
      ["Capture in 4K", "Keep UI details readable on every screen and in every embed."],
      [
        "Pause, undo, and restart",
        "Stay in control while you find the cleanest path through the workflow."
      ],
      ["Add voice and webcam", "Explain the why without leaving the recording flow."]
    ]
  },
  "sop-generator": {
    name: "SOP Generator",
    title: "Free AI SOP Generator",
    description:
      "Turn a recorded workflow into a clear, visual standard operating procedure that is easy to follow and keep current.",
    cta: "Try free SOP generator",
    introTitle: "How to create an SOP with Supademo",
    storyTitle: "Make process documentation feel like the product",
    storyDescription:
      "Show the exact screen, action, and next step so people can learn by doing instead of decoding a wall of text.",
    featureItems: [
      [
        "Capture the real process",
        "Document the workflow as it happens instead of reconstructing it later."
      ],
      [
        "Add concise instructions",
        "Pair every screen with the context a new teammate actually needs."
      ],
      ["Keep one source current", "Update the demo once when the process changes."]
    ]
  },
  "manual-maker": {
    name: "Manual Maker",
    title: "Free AI Manual Maker",
    description:
      "Create visual manuals from screenshots and recordings, with clear steps that anyone on the team can revisit.",
    cta: "Try free manual maker",
    introTitle: "How to make a visual manual with Supademo",
    storyTitle: "Replace long manuals with a path people can follow",
    storyDescription:
      "Keep instructions close to the interface and give readers a useful next action on every step.",
    featureItems: [
      ["Build from screens", "Start with the workflow people already recognize."],
      [
        "Annotate the important detail",
        "Use labels, hotspots, and blur to make the task safe and clear."
      ],
      ["Share one living guide", "Use a link that stays current as the workflow evolves."]
    ]
  },
  "free-screenshot-editor": {
    name: "Screenshot Editor",
    title: "Free Screenshot Editor",
    description:
      "Annotate, blur, crop, and share a product screenshot in minutes, without opening a separate design tool.",
    cta: "Try free screenshot editor",
    introTitle: "How to edit a product screenshot with Supademo",
    storyTitle: "Make one screenshot answer the next question",
    storyDescription:
      "Add the context that turns a raw capture into a useful update, lesson, or follow-up.",
    featureItems: [
      [
        "Annotate without clutter",
        "Use focused callouts that point to the one detail that matters."
      ],
      ["Blur sensitive information", "Protect private data before you publish the image."],
      ["Share instantly", "Send a clean link or add the image to a larger story."]
    ]
  },
  "screenshot-link-generator": {
    name: "Screenshot Link Generator",
    title: "Free Screenshot Link Generator with Tracking",
    description:
      "Turn a screenshot into a shareable link with the context, annotations, and access controls your audience needs.",
    cta: "Try free screenshot link generator",
    introTitle: "How to create a screenshot link with Supademo",
    storyTitle: "Give every screenshot a useful destination",
    storyDescription:
      "Stop attaching orphaned images. Put the next action, explanation, and right audience around the capture.",
    featureItems: [
      [
        "Upload or capture",
        "Start from a screenshot you already have or create one in the browser."
      ],
      ["Add context", "Use annotations and short instructions to keep the story moving."],
      ["Control access", "Share a public, gated, or expiring link with confidence."]
    ]
  },
  "annotation-generator": {
    name: "Annotation Generator",
    title: "Free AI Annotation Generator",
    description:
      "Auto-annotate screenshots, images, and documentation with arrows, callouts, numbered steps, and highlights in seconds. No login required.",
    cta: "Start annotating for free",
    introTitle: "How to annotate screenshots with Supademo",
    storyTitle: "Why we built a free annotation generator",
    storyDescription:
      "Keep annotation simple, consistent, and close to the action so the viewer never has to guess what changed.",
    featureItems: [],
    steps: [
      "1. Upload your screenshot",
      "2. Add annotations",
      "3. Fine-tune your annotations",
      "4. Export or share"
    ],
    faqQuestions: [
      "How does an AI annotation generator work?",
      "How does Supademo compare to Snagit for annotations?",
      "How does Supademo compare to Markup Hero or CloudApp?",
      "Can I annotate screenshots without creating an account?",
      "What types of annotations can I create?",
      "Can I turn annotated screenshots into step-by-step guides?",
      "Are there limits on the free annotation generator?",
      "Is Supademo's annotation tool secure for business use?"
    ]
  },
  "mobile-app-demos": {
    name: "Mobile App Demos",
    title: "Free AI Mobile App Demo Maker",
    description:
      "Show iOS and Android workflows with touch-friendly paths, clear steps, and a shareable experience that works beyond the app store.",
    cta: "Try free mobile app demos",
    introTitle: "How to create a mobile app demo with Supademo",
    storyTitle: "What makes Supademo's mobile app demos different",
    storyDescription:
      "Make the small screen understandable with a guided path, touch-sized controls, and an obvious next action.",
    featureItems: [
      [
        "Showcase mobile apps without live demos or hardware",
        "Bring the moments that matter into a focused, interactive story."
      ],
      [
        "Personalize mobile demos for every buyer persona",
        "Keep controls legible and reachable for phone-sized viewers."
      ],
      [
        "Track exactly how prospects engage with your demo",
        "Send a link that works in campaigns, sales, and onboarding."
      ]
    ],
    longformTitle: "Why we built Supademo's mobile app demo maker",
    steps: [
      "Record or upload your mobile screens",
      "Add interactivity with AI annotations",
      "Share, embed, and track engagement"
    ],
    useCaseTitle: "Who uses Supademo's mobile app demo maker?",
    useCaseItems: [
      "Mobile demos prospects explore on their own phone",
      "How do sales teams use Mobile App Demos?",
      "How do marketing teams use Mobile App Demos?",
      "How do customer success teams use Mobile App Demos?",
      "How do support teams use Mobile App Demos?",
      "How do product teams use Mobile App Demos?",
      "How do training teams use Mobile App Demos?"
    ],
    faqQuestions: [
      "Why use a mobile app demo maker instead of recording your screen?",
      "How do I create a mobile app demo without a phone?",
      "Can I create both iPhone demos and Android demos with Supademo?",
      "How is Supademo different from Appetize or BrowserStack for mobile demos?",
      "Can I embed mobile app demos on my website?",
      "Do mobile app demos include analytics?",
      "Can I personalize mobile demos for different audiences?",
      "Is Supademo's mobile app demo maker free?"
    ]
  }
};

export function getToolDetail(slug: string): ToolDetail | null {
  return toolDetails[slug] ?? null;
}

export function getToolDetailMetadata(slug: string) {
  const detail = getToolDetail(slug);
  return detail
    ? { title: `${detail.title} | Supademo`, description: detail.description }
    : { title: "Supademo free tools", description: "Free tools for building product demos." };
}

export function MarketingToolDetail({ slug }: { slug: string }) {
  const detail = getToolDetail(slug) ?? toolDetails["interactive-demo-builder"];
  const isAnnotation = slug === "annotation-generator";
  const isScreenshotEditor = slug === "free-screenshot-editor";
  return (
    <main className={`tool-detail-page tool-detail-${slug}`} id="main">
      <MarketingHeader />
      <section className="tool-detail-hero" aria-labelledby="tool-detail-title">
        <div className="tool-detail-breadcrumb" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">›</span>
          <a href="/tools">Free Tools</a>
          <span aria-hidden="true">›</span>
          <strong>{detail.name}</strong>
        </div>
        <h1 id="tool-detail-title">{detail.title}</h1>
        <p>{detail.description}</p>
        <a className="marketing-button" href="/signup">
          {detail.cta} <span aria-hidden="true">→</span>
        </a>
        {!isAnnotation ? (
          <div className="tool-detail-preview" aria-label={`${detail.name} preview`} role="img">
            <img
              src="https://supademo.com/tools/demo-editor.avif"
              alt={`${detail.name} with hotspots and branching`}
              loading="eager"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : null}
      </section>

      {isAnnotation ? (
        <div className="tool-detail-annotation-workbench">
          <div className="tool-detail-annotation-editor" aria-label="Annotation editor preview">
            <div className="tool-detail-annotation-toolbar" aria-hidden="true">
              <span>⌗ Crop</span>
              <span>◉ Redact</span>
              <span>↗ Arrow</span>
              <span>□ Rectangle</span>
              <span>／ Highlighter</span>
              <span>T Text</span>
              <span>◐ Background</span>
            </div>
            <div className="tool-detail-annotation-canvas">
              <div>
                <h3>Free Annotation Generator</h3>
                <p>
                  Upload a screenshot or image and use arrows, rectangles, text, and highlights to
                  mark up your content. Download or copy when done. No signup required.
                </p>
              </div>
              <span>Drop an image here or click to upload</span>
            </div>
          </div>
        </div>
      ) : null}
      {isScreenshotEditor ? <ScreenshotEditorWorkbench /> : null}

      <ToolDetailInteractions />

      <section className="tool-detail-how" aria-labelledby="tool-detail-how-title">
        <div className="tool-detail-section-inner">
          <p className="tool-detail-eyebrow">Simple by design</p>
          <h2 id="tool-detail-how-title">{detail.introTitle}</h2>
          <div className="tool-detail-step-grid">
            {(
              detail.steps ?? [
                "Record your product flow",
                "Add hotspots, branching, and voiceovers",
                "Share or embed anywhere"
              ]
            ).map((title, index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>Capture one clear path and keep the next action obvious.</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="tool-detail-difference" aria-labelledby="tool-detail-difference-title">
        <div className="tool-detail-section-inner">
          <p className="tool-detail-eyebrow">Built for modern teams</p>
          <h2 id="tool-detail-difference-title">{detail.storyTitle}</h2>
          <p className="tool-detail-lede">{detail.storyDescription}</p>
          <div className="tool-detail-feature-grid">
            {detail.featureItems.map(([title, description], index) => (
              <article key={title}>
                <span>0{index + 1}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {!isAnnotation ? (
        <section className="tool-detail-longform" aria-labelledby="tool-detail-longform-title">
          <div className="tool-detail-section-inner">
            <p className="tool-detail-eyebrow">Why teams choose Supademo</p>
            <h2 id="tool-detail-longform-title">
              {detail.longformTitle ?? `Why we built Supademo's ${detail.name.toLowerCase()}`}
            </h2>
            <p className="tool-detail-lede">
              The product should be easier to understand than the meeting needed to explain it. Give
              every audience a calm, self-paced path to the moments that matter.
            </p>
            <div className="tool-detail-story-card">
              <div>
                <strong>Joseph Lee</strong>
                <span>Co-founder &amp; CEO, Supademo</span>
              </div>
              <p>“The best product explanation is the one people can explore on their own time.”</p>
            </div>
          </div>
        </section>
      ) : null}

      {!isAnnotation ? (
        <ToolDetailInteractions
          showTrust={false}
          useCaseItems={detail.useCaseItems ?? []}
          useCaseTitle={
            detail.useCaseTitle ?? `How teams use Supademo's ${detail.name.toLowerCase()}`
          }
        />
      ) : null}

      {isScreenshotEditor ? (
        <section className="tool-detail-editor-cta" aria-labelledby="tool-detail-editor-cta-title">
          <div className="tool-detail-section-inner">
            <p className="tool-detail-eyebrow">Beyond screenshots</p>
            <h2 id="tool-detail-editor-cta-title">
              From screenshot edits to interactive product demos
            </h2>
            <p className="tool-detail-lede">
              Supademo goes beyond screenshots. Create interactive product demos, walkthroughs, and
              tutorials that can be embedded, shared, and tracked across every customer touchpoint.
            </p>
            <a className="marketing-button" href="/signup">
              Create your first Supademo <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      ) : null}

      {!isAnnotation ? (
        <section className="tool-detail-similar" aria-labelledby="tool-detail-similar-title">
          <div className="tool-detail-section-inner">
            <h2 id="tool-detail-similar-title">Explore Similar Free Tools</h2>
            <div className="tool-detail-similar-grid">
              {[
                [
                  "Interactive Demo",
                  "Interactive Walkthrough Builder",
                  "interactive-walkthrough-builder"
                ],
                ["Video & Visual", "Screen Recorder", "screen-recorder"],
                ["Docs & Guides", "Manual Maker", "manual-maker"],
                [
                  "Product Tours",
                  "Interactive Product Tour Builder",
                  "interactive-product-tour-builder"
                ]
              ].map(([group, label, toolSlug]) => (
                <div key={group}>
                  <strong>{group}</strong>
                  <a href={`/tools/${toolSlug}`}>
                    {label}
                    <span aria-hidden="true">→</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="tool-detail-faq" aria-labelledby="tool-detail-faq-title">
        <div className="tool-detail-section-inner">
          <h2 id="tool-detail-faq-title">Frequently asked questions</h2>
          {(
            detail.faqQuestions ?? [
              "What can you do with an interactive demo builder?",
              "How do I create an interactive demo with Supademo?",
              "How is Supademo different from Navattic or Walnut?",
              "Can I add branching or conditional logic to my interactive demo?",
              "What analytics does Supademo provide for interactive demos?",
              "Can I embed interactive demos on my website?",
              "Is Supademo's interactive demo builder free?",
              "How do I build a no-code interactive demo for SaaS?",
              "What is an interactive demo builder, and how does it work?",
              "What does an AI demo maker do for SaaS?",
              "Is there a free no-code product demo builder?"
            ]
          ).map((question, index) => (
            <details key={`${question}-${index}`}>
              <summary>
                <h3>{question}</h3>
              </summary>
              <p>
                Yes. Start with a focused workflow, publish it when it is ready, and share the
                resulting Supademo with your audience.
              </p>
            </details>
          ))}
        </div>
      </section>

      {isScreenshotEditor ? (
        <section
          className="tool-detail-editor-bottom-cta"
          aria-labelledby="tool-detail-editor-bottom-cta-title"
        >
          <div className="tool-detail-section-inner">
            <p className="tool-detail-eyebrow">Built for polished product storytelling</p>
            <h2 id="tool-detail-editor-bottom-cta-title">
              Edit, Annotate, and Generate Screenshots Free Online
            </h2>
            <p className="tool-detail-lede">
              Supademo helps teams create interactive product demos, walkthroughs, tutorials, and
              onboarding guides that can be embedded, shared, tracked, and reused.
            </p>
            <a className="marketing-button" href="/signup">
              Start Editing Screenshots Now <span aria-hidden="true">→</span>
            </a>
          </div>
        </section>
      ) : null}

      {isAnnotation ? (
        <section className="tool-detail-cta" aria-labelledby="tool-detail-cta-title">
          <div>
            <p className="tool-detail-eyebrow">Make the product easier to experience</p>
            {isAnnotation ? (
              <h2 id="tool-detail-cta-title">Auto-Annotate Screenshots in Seconds</h2>
            ) : (
              <p className="tool-detail-cta-title" id="tool-detail-cta-title">
                The fastest way to create interactive product demos
              </p>
            )}
          </div>
          <a className="marketing-button marketing-button-light" href="/signup">
            Create your first Supademo <span aria-hidden="true">→</span>
          </a>
        </section>
      ) : null}
      <MarketingFooter variant="showcase" />
    </main>
  );
}
