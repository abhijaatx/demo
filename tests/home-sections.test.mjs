import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readWebFile = (path) => readFile(new URL(`../apps/web/${path}`, import.meta.url), "utf8");

test("workspace home and navigation support Hubs, Analytics, Leads, Billing, and Help sections", async () => {
  const [workspaceHome, sectionViews, shell] = await Promise.all([
    readWebFile("app/app/page.tsx"),
    readWebFile("components/section-views.tsx"),
    readWebFile("components/app-shell.tsx")
  ]);

  assert.match(workspaceHome, /validSections/u);
  assert.match(workspaceHome, /<SectionView section=\{section\} \/>/u);

  assert.match(sectionViews, /data-section="hubs"/u);
  assert.match(sectionViews, /data-section="analytics"/u);
  assert.match(sectionViews, /data-section="leads"/u);
  assert.match(sectionViews, /data-section="billing"/u);
  assert.match(sectionViews, /data-section="help"/u);

  assert.match(shell, /isSectionMatch =/u);
  assert.match(shell, /"\/app\?section=hubs"/u);
  assert.match(shell, /"\/app\?section=analytics"/u);
  assert.match(shell, /"\/app\?section=leads"/u);
  assert.match(shell, /"\/app\?section=billing"/u);
  assert.match(shell, /"\/app\?section=help"/u);
});

test("authenticated Supademo home route exposes the reference workspace and bounded client interactions", async () => {
  const [route, home, css, auth] = await Promise.all([
    readWebFile("app/home/page.tsx"),
    readWebFile("components/home-workspace.tsx"),
    readWebFile("app/globals.css"),
    readWebFile("components/auth-screen.tsx")
  ]);

  assert.match(route, /HomeWorkspace/u);
  assert.match(route, /robots: \{ index: false, follow: false \}/u);
  assert.match(home, /Voiceovers 2\.0, Advanced Search/u);
  assert.match(home, /juneUpdateArtwork/u);
  assert.match(home, /media\.supademo\.com\/clf7r5s6900giyy0h6trezsck/u);
  assert.match(home, /href="\/demos"/u);
  assert.match(home, /href="\/ai\/demo-agents"/u);
  assert.match(home, /href="\/blog\/product-update-june-recap"/u);
  assert.match(home, /Explore lessons by goal/u);
  assert.match(home, /aria-selected=\{activeTab === tab\}/u);
  assert.match(home, /setFeaturedVisible\(false\)/u);
  assert.match(home, /query\.trim\(\)\.toLowerCase\(\)/u);
  assert.doesNotMatch(home, /dangerouslySetInnerHTML|innerHTML|eval\(/u);
  assert.match(css, /\.home-workspace/u);
  assert.match(css, /home-featured-art-in/u);
  assert.match(css, /prefers-reduced-motion: reduce/u);
  assert.match(auth, /href="\/home"/u);
});

test("authenticated reference workspace destinations expose fixed, non-executing surfaces", async () => {
  const [surface, css, ...routes] = await Promise.all([
    readWebFile("components/workspace-reference-surface.tsx"),
    readWebFile("app/globals.css"),
    ...[
      "app/demos/page.tsx",
      "app/videos/page.tsx",
      "app/showcases/page.tsx",
      "app/hubs/page.tsx",
      "app/routes/page.tsx",
      "app/analytics/page.tsx"
    ].map(readWebFile)
  ]);

  for (const route of routes) {
    assert.match(route, /WorkspaceReferenceSurface/u);
    assert.match(route, /robots: \{ index: false, follow: false \}/u);
  }

  assert.match(surface, /Team Supademos/u);
  assert.match(surface, /Snap beautiful screenshots instantly/u);
  assert.match(surface, /No videos yet/u);
  assert.match(surface, /Welcome to Route Hub/u);
  assert.match(surface, /Supademo Views/u);
  assert.match(surface, /Recent Viewers/u);
  assert.match(surface, /setRecentTab\("Recent Accounts"\)/u);
  assert.match(surface, /Device &amp; Location/u);
  assert.match(surface, /Try product demo/u);
  assert.match(surface, /Filter analytics/u);
  assert.match(surface, /workspace-ref-chart-viewers-line/u);
  assert.match(surface, /workspace-ref-chart-engagement-line/u);
  assert.match(surface, /role="img"\s+aria-label="Views and engagement chart"/u);
  assert.match(surface, /media\.supademo\.com\/clf7r5s6900giyy0h6trezsck/u);
  assert.match(css, /workspace-ref-enter/u);
  assert.match(css, /workspace-ref-feature-in/u);
  assert.doesNotMatch(surface, /dangerouslySetInnerHTML|innerHTML|eval\(|new Function\(/u);
});

test("workspace home keeps creation as the obvious first action and exposes the creator workflow", async () => {
  const [workspaceHome, css] = await Promise.all([
    readWebFile("app/app/page.tsx"),
    readWebFile("app/globals.css")
  ]);

  assert.match(workspaceHome, /Make your next demo easy to follow\./u);
  assert.match(workspaceHome, /Explore sample demos/u);
  assert.match(workspaceHome, /Your creation flow/u);
  assert.match(workspaceHome, /Record[\s\S]*Edit[\s\S]*Share/u);
  assert.match(workspaceHome, /href: "\/demos"/u);
  assert.match(workspaceHome, /\/demos\?folder=templates/u);
  assert.match(workspaceHome, /encodeURIComponent\(demo\.id\)/u);
  assert.doesNotMatch(workspaceHome, /href="#demo"/u);
  assert.match(css, /\.hero-progress/u);
  assert.match(css, /\.stage-card\.blue/u);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/u);
});

test("public marketing routes make the product preview and valid entry actions available", async () => {
  const [publicHome, marketingHome, productPage, productMarketing, chrome, css] = await Promise.all(
    [
      readWebFile("app/page.tsx"),
      readWebFile("components/marketing-home.tsx"),
      readWebFile("app/product/page.tsx"),
      readWebFile("components/marketing-product.tsx"),
      readWebFile("components/marketing-chrome.tsx"),
      readWebFile("app/globals.css")
    ]
  );

  assert.match(publicHome, /MarketingHome/u);
  assert.match(publicHome, /Supademo: AI Interactive Product Demos/u);
  assert.match(marketingHome, /Exceptional product demos in minutes, not days/u);
  assert.match(marketingHome, /Interactive demo preview/u);
  assert.match(marketingHome, /hero-ai-demo-agent\.avif/u);
  assert.match(marketingHome, /Try Instant AI Agent Demo/u);
  assert.match(marketingHome, /aria-pressed=\{index === activeStep\}/u);
  assert.match(marketingHome, /role="tablist" aria-label="Demo formats"/u);
  assert.match(marketingHome, /role="tablist" aria-label="Use cases"/u);
  assert.match(marketingHome, /marketing-home-trust/u);
  assert.match(marketingHome, /marketing-home-live-use-case-shell/u);
  assert.match(marketingHome, /marketing-home-live-use-case-card/u);
  assert.match(marketingHome, /marketing-home-metric-grid/u);
  assert.match(marketingHome, /aria-expanded=\{isActive\}/u);
  assert.match(marketingHome, /marketing-home-format-rows/u);
  assert.match(marketingHome, /marketing-home-scale-grid/u);
  assert.match(marketingHome, /MarketingFooter variant="showcase"/u);
  assert.match(marketingHome, /referrerPolicy="no-referrer"/u);
  assert.match(marketingHome, /<details(?:\s|>)/u);
  assert.match(marketingHome, /World-class product demos, the fast and easy way/u);
  assert.match(marketingHome, /Start creating/u);
  assert.match(marketingHome, /href="\/auth"/u);
  assert.match(marketingHome, /href="\/product-demo"/u);
  assert.match(chrome, /href="\/product"/u);
  assert.match(chrome, /href="\/product-demo"/u);
  assert.match(productPage, /MarketingNotFoundPage/u);
  assert.match(productPage, /Supademo: AI Interactive Product Demos/u);
  assert.match(productMarketing, /Every useful product story starts with a real moment\./u);
  assert.match(productMarketing, /From capture to guided product demo/u);
  assert.match(productMarketing, /href="\/auth"/u);
  assert.doesNotMatch(
    `${marketingHome}\n${productMarketing}\n${chrome}`,
    /dangerouslySetInnerHTML|innerHTML|eval\(/u
  );
  assert.match(css, /\.marketing-hero/u);
  assert.match(css, /\.marketing-demo-frame/u);
  assert.match(css, /\.marketing-home-ai-button/u);
  assert.match(css, /\.marketing-home-live-use-case-card/u);
  assert.match(css, /\.marketing-home-metric-grid/u);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/u);
  assert.match(css, /\.marketing-mode-section/u);
  assert.match(css, /\.marketing-use-case-section/u);
  assert.match(css, /\.marketing-faq-section/u);
  assert.match(css, /\.product-page-hero/u);
  assert.match(css, /\.marketing-not-found-hero/u);
});
