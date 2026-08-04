import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("public reference fallback renders discovered marketing slugs in the shared chrome", async () => {
  const [
    route,
    surface,
    chrome,
    content,
    css,
    useCaseRoute,
    toolRoute,
    productDemoRoute,
    featureDetail,
    features,
    sandboxCarousel,
    routeHubCalculator,
    analyticsTabs,
    showcaseTabs,
    showcaseEmbed,
    customerDetail,
    industryDetail,
    blog,
    report
  ] = await Promise.all([
    readWebFile("app/[...slug]/page.tsx"),
    readWebFile("components/marketing-reference-page.tsx"),
    readWebFile("components/marketing-chrome.tsx"),
    readWebFile("components/marketing-content-page.tsx"),
    readWebFile("app/globals.css"),
    readWebFile("app/use-cases/[slug]/page.tsx"),
    readWebFile("app/tools/[slug]/page.tsx"),
    readWebFile("app/product-demo/[slug]/page.tsx"),
    readWebFile("components/marketing-feature-detail.tsx"),
    readWebFile("components/marketing-features.tsx"),
    readWebFile("components/sandbox-scale-carousel.tsx"),
    readWebFile("components/route-hub-calculator.tsx"),
    readWebFile("components/analytics-use-case-tabs.tsx"),
    readWebFile("components/showcase-use-case-tabs.tsx"),
    readWebFile("components/showcase-embed-preview.tsx"),
    readWebFile("components/marketing-customer-detail.tsx"),
    readWebFile("components/marketing-industry.tsx"),
    readWebFile("components/marketing-blog.tsx"),
    readWebFile("components/marketing-report.tsx")
  ]);

  assert.match(route, /reservedRoots/u);
  assert.match(route, /notFoundRoots/u);
  assert.match(route, /"resources"/u);
  assert.match(route, /"%40supademohq"/u);
  assert.match(route, /notFound()/u);
  assert.match(surface, /MarketingHeader/u);
  assert.match(surface, /MarketingFooter/u);
  assert.match(chrome, /variant\?: "default" \| "sharing"/u);
  assert.match(chrome, /variant === "sharing"/u);
  assert.match(surface, /Start for free/u);
  assert.match(surface, /Interactive demo preview/u);
  assert.match(surface, /MarketingContentPage/u);
  assert.match(surface, /State of Interactive Demos 2026: Industry Research Report/u);
  assert.doesNotMatch(surface, /from "\.\/marketing-industry"/u);
  assert.match(content, /content-directory-page/u);
  assert.match(content, /content-article-page/u);
  assert.match(content, /content-legal-page/u);
  assert.match(content, /b41cb0939e134b3df1d2ff61ed71634da14c8eb2-2034x1090\.jpg/u);
  assert.match(content, /referrerPolicy="no-referrer"/u);
  assert.match(content, /content-article-mcp-header/u);
  assert.match(content, /What is an MCP\? How does it work with Supademo\?/u);
  assert.match(content, /content-article-mcp-video/u);
  assert.match(content, /content-article-mcp-tag/u);
  assert.match(content, /getMarketingBlogArticle/u);
  assert.match(content, /content-article-hero-image/u);
  assert.match(content, /MarketingReportPage/u);
  assert.match(content, /content\/state-of-interactive-demos-2026/u);
  assert.match(blog, /export function getMarketingBlogArticle/u);
  assert.match(blog, /initialCategory = "All"/u);
  assert.match(blog, /interactive-product-demo/u);
  assert.match(surface, /legacyBlogMetadata/u);
  assert.match(blog, /normalized = pathname\.replace/u);
  assert.match(report, /State of Interactive Demos 2026/u);
  assert.match(report, /role="tablist"/u);
  assert.match(report, /marketing-report-nav/u);
  assert.match(report, /aria-current=\{activeSection === section\.id/u);
  assert.match(content, /aria-selected=\{filter === category\}/u);
  assert.match(useCaseRoute, /MarketingReferencePage/u);
  assert.match(toolRoute, /MarketingReferencePage/u);
  assert.match(productDemoRoute, /MarketingReferencePage/u);
  assert.match(route, /MarketingFeatureDetail/u);
  assert.match(featureDetail, /ReferenceFeatureDetailPage/u);
  assert.match(featureDetail, /referenceDemoEditorRows/u);
  assert.match(featureDetail, /referencePersonalizationRows/u);
  assert.match(featureDetail, /referenceDemoCapabilities/u);
  assert.match(featureDetail, /referenceDemoEditorFaqs/u);
  assert.match(featureDetail, /referencePersonalizationFaqs/u);
  assert.match(featureDetail, /Create your first Supademo/u);
  assert.match(featureDetail, /Customize text and visuals/u);
  assert.match(featureDetail, /Add custom branding/u);
  assert.match(featureDetail, /personalization-5\.avif/u);
  assert.match(featureDetail, /editor-4\.avif/u);
  assert.match(featureDetail, /referrerPolicy="no-referrer"/u);
  assert.match(route, /MarketingCustomerDetail/u);
  assert.match(featureDetail, /guided-html-demo/u);
  assert.match(featureDetail, /showcase-collection/u);
  assert.match(featureDetail, /Powerful features to scale demo creation/u);
  assert.match(featureDetail, /Clone Your Product with No Code/u);
  assert.match(featureDetail, /Powerful uses cases for every team at your company/u);
  assert.match(featureDetail, /role="img"/u);
  assert.match(featureDetail, /guided-case-\$\{index\}/u);
  assert.match(featureDetail, /<details open=\{index === 0\}/u);
  assert.match(featureDetail, /Build elegant sandbox demos with no code/u);
  assert.match(featureDetail, /Eliminate engineering bottlenecks/u);
  assert.match(featureDetail, /Perfect for every stage of your sales process/u);
  assert.match(featureDetail, /Trusted by 200,000\+ top operators/u);
  assert.match(featureDetail, /showcase-trust-chooser/u);
  assert.match(featureDetail, /showcaseTrustLogos/u);
  assert.match(featureDetail, /FigmaFeaturePage/u);
  assert.match(featureDetail, /figma-demo-stage/u);
  assert.match(featureDetail, /figma-voiceovers\.webp/u);
  assert.match(featureDetail, /figmaFaqs/u);
  assert.match(featureDetail, /sandboxFaqs/u);
  assert.match(featureDetail, /sandbox-explore-grid/u);
  assert.match(featureDetail, /sandbox-demo-stage-browser/u);
  assert.match(featureDetail, /RouteHubFeaturePage/u);
  assert.match(featureDetail, /How much revenue could/u);
  assert.match(featureDetail, /routeHubFeatureRows/u);
  assert.match(featureDetail, /routeHubFaqs/u);
  assert.match(featureDetail, /Experience RouteHub interactively/u);
  assert.match(featureDetail, /block-1\.avif/u);
  assert.match(routeHubCalculator, /use client/u);
  assert.match(routeHubCalculator, /clampNumber/u);
  assert.match(routeHubCalculator, /navigator\.clipboard/u);
  assert.match(routeHubCalculator, /Incremental ARR \/ year/u);
  assert.match(routeHubCalculator, /aria-live/u);
  assert.match(featureDetail, /AnalyticsFeaturePage/u);
  assert.match(featureDetail, /Identify your most promising prospects/u);
  assert.match(featureDetail, /analyticsFeatureRows/u);
  assert.match(featureDetail, /analyticsFaqs/u);
  assert.match(featureDetail, /analytics-hero-art/u);
  assert.match(featureDetail, /DemoHubFeaturePage/u);
  assert.match(featureDetail, /In-app product tours that your users won't dismiss/u);
  assert.match(featureDetail, /demoHubExamples/u);
  assert.match(featureDetail, /demoHubComparison/u);
  assert.match(featureDetail, /demoHubFaqs/u);
  assert.match(featureDetail, /demo-hub-hero\.jpg/u);
  assert.match(featureDetail, /ShowcaseFeaturePage/u);
  assert.match(featureDetail, /Share multiple interactive/u);
  assert.match(featureDetail, /showcaseFeatureSteps/u);
  assert.match(featureDetail, /showcaseUseCases/u);
  assert.match(featureDetail, /showcaseFaqs/u);
  assert.match(featureDetail, /showcase-trust-logos/u);
  assert.match(featureDetail, /SharingFeaturePage/u);
  assert.match(featureDetail, /Share your interactive demos anywhere/u);
  assert.match(featureDetail, /sharingFeatureRows/u);
  assert.match(featureDetail, /sharingFaqs/u);
  assert.match(featureDetail, /sharing-hero-min\.avif/u);
  assert.match(featureDetail, /sharing-faq-item/u);
  assert.match(features, /features-carousel-card/u);
  assert.match(features, /scale-01\.avif/u);
  assert.match(features, /aria-label="Next"/u);
  assert.match(showcaseEmbed, /showcase-embed-preview-v3\.jpg/u);
  assert.match(analyticsTabs, /use client/u);
  assert.match(analyticsTabs, /role="tablist"/u);
  assert.match(analyticsTabs, /setActiveIndex/u);
  assert.match(showcaseTabs, /use client/u);
  assert.match(showcaseTabs, /role="tablist"/u);
  assert.match(showcaseTabs, /useState\(3\)/u);
  assert.match(showcaseTabs, /Accelerate time-to-value/u);
  assert.match(showcaseEmbed, /use client/u);
  assert.match(showcaseEmbed, /showcaseSteps/u);
  assert.match(showcaseEmbed, /Previous step/u);
  assert.match(showcaseEmbed, /Next step/u);
  assert.doesNotMatch(showcaseEmbed, /showcase-embed-stage-bar" aria-hidden/u);
  assert.match(featureDetail, /\/features\/demo-hub/u);
  assert.match(featureDetail, /\/features\/showcase-collection/u);
  assert.match(featureDetail, /\/features\/route-hub/u);
  assert.match(featureDetail, /\/ai\/demo-agents/u);
  assert.doesNotMatch(featureDetail, /replaceAll/u);
  assert.match(sandboxCarousel, /use client/u);
  assert.match(sandboxCarousel, /setPage/u);
  assert.match(sandboxCarousel, /Previous capability/u);
  assert.match(sandboxCarousel, /Next capability/u);
  for (const slug of [
    "ai-data-edit",
    "ai-demo-audit",
    "ai-translation",
    "ai-voice-cloning",
    "ai-voiceover",
    "analytics",
    "annotations",
    "autoplay",
    "background-music",
    "blur",
    "chapters",
    "conditional-branching",
    "demo-editor",
    "demo-hub",
    "demo-recorder",
    "embed",
    "expiring-share-links",
    "figma",
    "forms",
    "guided-html-demo",
    "invisible-hotspots",
    "personalization",
    "route-hub",
    "sandbox-demos",
    "screen-recorder",
    "screenshot",
    "sharing",
    "showcase-collection",
    "trackable-share-links",
    "typewriter-effect"
  ]) {
    assert.match(featureDetail, new RegExp(slug, "u"));
  }
  assert.match(customerDetail, /vrify-case-study/u);
  assert.match(customerDetail, /greenpeace/u);
  assert.match(customerDetail, /VrifyCustomerStory/u);
  assert.match(customerDetail, /vrify-case-study-profile/u);
  assert.match(customerDetail, /vrify-product\.avif/u);
  assert.match(customerDetail, /vrify-product-2\.avif/u);
  assert.match(customerDetail, /What is the ROI of interactive demos/u);
  assert.match(content, /MarketingIndustryPage/u);
  assert.match(industryDetail, /case-studies\/case-study-header\.avif/u);
  assert.match(industryDetail, /industry-showcase-tabs/u);
  assert.match(industryDetail, /hasOwnProperty\.call\(industryConfig, value\)/u);
  for (const industry of ["software", "healthcare", "finance-banking", "government"]) {
    assert.match(industryDetail, new RegExp(`\\b${industry}\\b`, "u"));
  }
  assert.match(css, /\.marketing-reference-hero/u);
  assert.match(css, /\.feature-detail-hero/u);
  assert.match(css, /\.sandbox-hero/u);
  assert.match(css, /\.sandbox-trust-rail/u);
  assert.match(css, /\.figma-hero/u);
  assert.match(css, /\.figma-feature-rows/u);
  assert.match(css, /\.figma-faq/u);
  assert.match(css, /\.sandbox-scale-carousel/u);
  assert.match(css, /\.demo-hub-page/u);
  assert.match(css, /\.demo-hub-comparison/u);
  assert.match(css, /\.demo-hub-faq/u);
  assert.match(css, /\.showcase-page/u);
  assert.match(css, /\.showcase-hero/u);
  assert.match(css, /\.showcase-trust/u);
  assert.match(css, /\.showcase-use-case-section/u);
  assert.match(css, /\.showcase-faq/u);
  assert.match(css, /\.reference-feature-primary-inner/u);
  assert.match(css, /\.reference-feature-capabilities/u);
  assert.match(css, /\.reference-feature-personalization \.reference-feature-primary/u);
  assert.match(css, /\.reference-feature-page \+ \.marketing-footer-showcase/u);
  assert.match(css, /\.sharing-page/u);
  assert.match(css, /\.sharing-feature-band/u);
  assert.match(css, /\.sharing-explore-panel/u);
  assert.match(css, /\.sharing-faq-item/u);
  assert.match(css, /\.customer-detail-hero/u);
  assert.match(css, /\.vrify-case-study-hero/u);
  assert.match(css, /\.vrify-case-study-profile/u);
  assert.match(css, /\.vrify-case-study-faq/u);
  assert.match(featureDetail, /featureHeroImages/u);
  assert.match(featureDetail, /cma012xa5071z090hj7ltq31x/u);
  assert.match(featureDetail, /demo-recorder-demo-stage/u);
  assert.match(featureDetail, /demoRecorderPlatforms/u);
  assert.match(featureDetail, /Chrome Extension Recording/u);
  assert.match(featureDetail, /Mac Desktop Recording/u);
  assert.match(featureDetail, /Windows Desktop Recording/u);
  assert.match(featureDetail, /Upload Video and Screenshots/u);
  assert.match(featureDetail, /What methods can I use to record demos with Supademo\?/u);
  assert.match(customerDetail, /customerHeroImages/u);
  assert.match(css, /\.content-directory-hero/u);
  assert.match(css, /\.content-article-mcp-header\s*\{[\s\S]*grid-template-columns/u);
  assert.match(
    css,
    /\.content-article-mcp-page \.content-article-body\s*\{[\s\S]*background: transparent/u
  );
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.doesNotMatch(
    `${route}\n${surface}\n${content}\n${useCaseRoute}\n${toolRoute}\n${productDemoRoute}\n${featureDetail}\n${routeHubCalculator}\n${analyticsTabs}\n${customerDetail}\n${industryDetail}\n${blog}\n${report}`,
    /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u
  );
});

test("feature hero embeds keep third-party demo content sandboxed", async () => {
  const [featureDetail, chrome] = await Promise.all([
    readWebFile("components/marketing-feature-detail.tsx"),
    readWebFile("components/marketing-chrome.tsx")
  ]);

  assert.match(featureDetail, /ScreenRecorderHero/u);
  assert.match(featureDetail, /sandbox="allow-scripts allow-same-origin"/u);
  assert.match(featureDetail, /referrerPolicy="no-referrer"/u);
  assert.match(featureDetail, /https:\/\/app\.supademo\.com\/embed\//u);
  assert.match(chrome, /<a href="\/auth">Login<\/a>/u);
});
