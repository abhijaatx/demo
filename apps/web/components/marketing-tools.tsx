"use client";

import { useMemo, useState } from "react";
import { MarketingFooter, MarketingHeader } from "./marketing-chrome";

const categories = [
  "AI",
  "Calculator",
  "Docs",
  "Interactive",
  "Onboarding",
  "Prototype",
  "Screenshot",
  "Training",
  "Video"
] as const;

const tools = [
  [
    "AI Sales Pitch Generator",
    "Generate a compelling, outcome-focused sales pitch in seconds with AI",
    "ai-sales-pitch-generator",
    "AI"
  ],
  [
    "AI Sales Script Generator",
    "Generate a complete, structured sales call script in seconds with AI",
    "ai-sales-script-generator",
    "AI"
  ],
  [
    "Loom Video Downloader",
    "Download any public Loom video as an MP4 in seconds. No sign-up needed.",
    "loom-video-downloader",
    "Video"
  ],
  [
    "Free Screenshot Editor",
    "Snap, edit, and share screenshots with a powerful and modern screenshot editor",
    "free-screenshot-editor",
    "Screenshot"
  ],
  [
    "Screenshot Link Generator",
    "Upload any screenshot and create a shareable online link",
    "screenshot-link-generator",
    "Screenshot"
  ],
  [
    "Product Demo Video Maker",
    "Create product demo videos in minutes, completely for free",
    "product-demo-video-maker",
    "Video"
  ],
  [
    "Free Screen Recorder",
    "Record a video of your screen and share it for free - no app required",
    "screen-recorder",
    "Video"
  ],
  [
    "Interactive Demo Builder",
    "Wow users with step-by-step interactive product demos",
    "interactive-demo-builder",
    "Interactive"
  ],
  [
    "Interactive Walkthrough Builder",
    "Build interactive product walkthroughs to share as a link or embed",
    "interactive-walkthrough-builder",
    "Interactive"
  ],
  [
    "Interactive Product Tour Builder",
    "Create step-by-step tours for use in-app and out-of-app",
    "interactive-product-tour-builder",
    "Onboarding"
  ],
  [
    "Mobile App Demo Creator",
    "Create and share interactive demos of mobile apps",
    "mobile-app-demos",
    "Interactive"
  ],
  [
    "Step-by-Step Guide Generator",
    "Automatically generate guided step-by-step tutorials for free, in minutes.",
    "step-by-step-guide-generator",
    "Training"
  ],
  [
    "Screenshot Background Tool",
    "Add elegant backgrounds to your screenshots for free",
    "screenshot-background-tool",
    "Screenshot"
  ],
  [
    "QR Code Background Generator",
    "Generate QR codes with custom backgrounds, transparent overlays, and gradient designs for free",
    "qr-code-background",
    "Screenshot"
  ],
  [
    "CAC Calculator",
    "Calculate customer acquisition cost, CAC payback period, and LTV:CAC ratio",
    "cac-calculator",
    "Calculator"
  ],
  [
    "Win Rate Calculator",
    "Calculate sales win rate and model the revenue impact of better conversion",
    "win-rate-calculator",
    "Calculator"
  ],
  [
    "LTV Calculator",
    "Calculate SaaS customer lifetime value, LTV:CAC ratio, and churn impact",
    "ltv-calculator",
    "Calculator"
  ],
  [
    "Marketing ROI Calculator",
    "Calculate marketing ROI, ROAS, revenue per dollar spent, CPL, and conversion rate",
    "marketing-roi-calculator",
    "Calculator"
  ],
  [
    "NPS Calculator",
    "Calculate your Net Promoter Score from promoter, passive, and detractor counts",
    "nps-calculator",
    "Calculator"
  ],
  [
    "CSAT Calculator",
    "Calculate customer satisfaction score and gap to target from survey responses",
    "csat-calculator",
    "Calculator"
  ],
  [
    "Retention Rate Calculator",
    "Calculate customer retention rate, churn rate, and customers lost for any period",
    "retention-rate-calculator",
    "Calculator"
  ],
  [
    "Training ROI Calculator",
    "Calculate training ROI, cost per employee, annual benefit, and payback period",
    "training-roi-calculator",
    "Calculator"
  ],
  [
    "NRR Calculator",
    "Calculate net revenue retention, ending MRR, expansion rate, and MRR churn rate",
    "nrr-calculator",
    "Calculator"
  ],
  [
    "Employee Turnover Calculator",
    "Calculate annual employee turnover cost, employees lost per year, and cost per replacement",
    "employee-turnover-calculator",
    "Calculator"
  ],
  [
    "Employee Onboarding Cost Calculator",
    "Calculate annual onboarding cost, cost per new hire, and total trainer hours per year",
    "employee-onboarding-cost-calculator",
    "Calculator"
  ],
  [
    "Annotation Generator",
    "Automatically generate text annotations or annotate screenshots or content for free.",
    "annotation-generator",
    "Screenshot"
  ],
  [
    "Online Image Blur Tool",
    "Easily blur images and screenshots online with Supademo's free image blur tool",
    "online-image-blur-tool",
    "Screenshot"
  ],
  [
    "Free Snipping Tool",
    "Free snipping and screenshot tool for Windows, Mac and Linux",
    "free-snipping-tool",
    "Screenshot"
  ],
  [
    "iFrame to SCORM Converter",
    "Convert any iFrame or Supademo into a SCORM package for your LMS in seconds",
    "iframe-to-scorm",
    "Docs"
  ],
  ["Free Online Manual Maker", "Craft interactive manuals for free", "manual-maker", "Docs"],
  [
    "AI-Powered SOP Generator",
    "Generate modern step-by-step guides effortlessly with AI",
    "sop-generator",
    "Docs"
  ],
  [
    "Product Tutorial Maker",
    "Create interactive tutorials for software apps, education, or training",
    "tutorial-maker",
    "Training"
  ],
  [
    "Free AI Documentation Generator",
    "Create interactive tutorials for software apps, education, or training",
    "ai-documentation-generator",
    "Docs"
  ],
  [
    "Free Workflow Generator",
    "Create modern business workflows effortlessly for free",
    "workflow-generator",
    "Docs"
  ],
  [
    "Free Webcam Recorder",
    "Record a video of your webcam and screen for free - no app required",
    "webcam-recorder",
    "Video"
  ],
  [
    "Free Demo GIF Maker",
    "Transform your product demos into engaging demo GIFs",
    "demo-gif-maker",
    "Video"
  ],
  [
    "Free Explainer Video Maker",
    "Craft compelling explainer videos for apps or SaaS products",
    "explainer-video-maker",
    "Video"
  ],
  [
    "Free Training Video Maker",
    "Develop professional learning and training content at no cost",
    "training-video-maker",
    "Video"
  ],
  [
    "Crop Videos for Free",
    "Crop videos online in seconds with Supademo's free video cropper",
    "crop-video",
    "Video"
  ],
  [
    "Free Video Snipping Tool",
    "Snip videos online with Supademo's free tool",
    "video-snipping-tool",
    "Video"
  ],
  [
    "Interactive Video Builder",
    "Create interactive, clickable videos with hotspots, branching paths, and AI voiceovers — built for product demos",
    "interactive-video-builder",
    "Interactive"
  ],
  [
    "Add Hotspots to Video",
    "Overlay clickable hotspots and dynamic branching to existing videos",
    "interactive-video-hotspot",
    "Interactive"
  ],
  [
    "Clickable Prototype Maker",
    "Create clickable prototypes for your product or feature using Figma or uploads",
    "prototype-maker",
    "Prototype"
  ],
  [
    "Free Interactive Slideshow Maker",
    "Create engaging interactive slideshows for free",
    "interactive-slideshow-maker",
    "Interactive"
  ],
  [
    "Interactive Presentation Builder",
    "Create immersive, interactive pitch decks and presentations with built-in tracking",
    "interactive-presentation-builder",
    "Interactive"
  ],
  [
    "AI-Powered Roadmap Maker",
    "Create interactive visual roadmaps instantly for free",
    "roadmap-maker",
    "Docs"
  ],
  [
    "Free Employee Onboarding Tool",
    "Launch effective onboarding for new team members",
    "employee-onboarding-tool",
    "Onboarding"
  ],
  [
    "AI Employee Handbook Builder",
    "Easily design, customize, and share employee handbooks",
    "employee-handbook-builder",
    "Docs"
  ],
  [
    "Free Employee Training Tool",
    "Create free online employee training guides",
    "employee-training-tool",
    "Training"
  ],
  [
    "Free Digital Transformation Tool",
    "Drive digital transformation without heavy, complex software",
    "digital-transformation-tool",
    "Training"
  ],
  [
    "Free Microlearning App",
    "Create bite-sized training modules with this free microlearning app",
    "microlearning-app",
    "Training"
  ],
  [
    "Free eLearning Authoring Tool",
    "Create and share engaging eLearning content",
    "elearning-authoring-tool",
    "Training"
  ],
  [
    "Free Remote Training Software",
    "Train remote teams with this free remote training tool",
    "remote-training-software",
    "Training"
  ],
  [
    "Free Compliance Training Platform",
    "Create interactive compliance training modules for free",
    "compliance-training-software",
    "Training"
  ],
  [
    "Free Software Simulator",
    "Use Supademo to simulate your software product for free",
    "software-simulator",
    "Interactive"
  ],
  [
    "Free Training Simulation Software",
    "Create realistic, interactive simulations for free",
    "training-simulation-software",
    "Training"
  ]
] as const;

function ToolIcon({ category }: { category: string }) {
  return (
    <span className="tools-card-icon" aria-hidden="true">
      {category === "Calculator" ? "#" : category === "Video" ? "▶" : category === "AI" ? "✦" : "⌁"}
    </span>
  );
}

export function MarketingTools() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(true);

  const visibleTools = useMemo(
    () =>
      selectedCategories.length === 0
        ? tools
        : tools.filter(([, , , category]) => selectedCategories.includes(category)),
    [selectedCategories]
  );

  function toggleCategory(category: string) {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  }

  return (
    <main className="tools-page" id="main">
      <MarketingHeader />
      <section className="tools-hero" aria-labelledby="tools-title">
        <div className="tools-hero-copy">
          <p className="tools-eyebrow">Free tools for better demos</p>
          <h1 id="tools-title">Free Tools For Better Product Demos</h1>
          <p>
            Supademo makes product demos and guides fast, intuitive and effective. Create
            interactive demos, app prototypes or beautiful screenshots for free!
          </p>
          <a className="marketing-button" href="#tools-list">
            Explore Free Tools <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="tools-hero-art" aria-label="Supademo tools dashboard" role="img">
          <img
            src="https://supademo.com/images/tools-hero-img-02.avif"
            alt="Supademo tools dashboard"
            loading="eager"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      <section className="tools-library" id="tools-list" aria-labelledby="tools-list-title">
        <div className="tools-library-heading">
          <p className="tools-eyebrow">Toolbox</p>
          <h2 id="tools-list-title">Explore popular free tools</h2>
          <p aria-live="polite">{visibleTools.length} tools available</p>
        </div>
        <div className="tools-library-layout">
          <aside className="tools-filters" aria-label="Filter tools">
            <h3>Filter by</h3>
            <button
              type="button"
              aria-expanded={categoryOpen}
              onClick={() => setCategoryOpen((current) => !current)}
            >
              Category <span aria-hidden="true">⌃</span>
            </button>
            {categoryOpen ? (
              <fieldset>
                <legend className="sr-only">Tool categories</legend>
                {categories.map((category) => (
                  <label key={category}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleCategory(category)}
                    />
                    <span>{category}</span>
                  </label>
                ))}
              </fieldset>
            ) : null}
            <button
              type="button"
              className="tools-clear-filters"
              onClick={() => setSelectedCategories([])}
            >
              Clear all filters
            </button>
          </aside>
          <div className="tools-grid" aria-live="polite">
            {visibleTools.map(([name, description, slug, category]) => (
              <article className="tools-card" key={slug}>
                <ToolIcon category={category} />
                <h3>{name}</h3>
                <p>{description}</p>
                <a href={`/tools/${slug}`}>
                  Try it live <span aria-hidden="true">→</span>
                </a>
              </article>
            ))}
            {visibleTools.length === 0 ? (
              <p className="tools-empty">No tools match those categories yet.</p>
            ) : null}
          </div>
        </div>
      </section>
      <MarketingFooter />
    </main>
  );
}
