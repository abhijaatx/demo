SECURITY REVIEW REQUEST

Change summary:

- Completed the long-page fidelity pass for the public AI, Academy, Showcase, Tutorials, and Help
  surfaces. Academy now includes the reference lesson carousel, image-led guide tiles, and CTA;
  AI includes the dark trust proof, four feature rows, toolkit, and agent sections; Showcase
  includes the full reference catalog section set and real reference thumbnails; Tutorials uses
  bounded search/tool filters and fixed Supademo tutorial screenshots; Help retains an accessible
  interactive-tour CTA.
- Aligned the updated surfaces' page titles with the captured Supademo metadata and preserved the
  existing reduced-motion and keyboard interaction behavior.

- Added route-specific feature detail surfaces for every captured `/features/*` URL.
- Added route-specific customer story surfaces for every captured `/customers/*` URL.
- Replaced the generic industry fallback with allowlisted, data-driven surfaces for
  `/industries/software`, `/industries/healthcare`, `/industries/finance-banking`, and
  `/industries/government`, including accessible example tabs and bounded carousel controls.
- Wired long-tail blog article routes to the blog index's canonical metadata and fixed Sanity
  hero assets, so article titles, descriptions, author/date metadata, and reference artwork stay
  consistent between the directory and article pages.
- Added a dedicated interactive research-report surface for
  `/content/state-of-interactive-demos-2026`, including the reference hero, sticky section
  navigation, team tabs, chart/table toggle, findings, impact data, and report CTA.
- Added a filtered Product Updates blog surface at `/blog/product-updates`, reusing the canonical
  blog catalog and preserving the same bounded search/category controls as the main blog page.
- Added canonical metadata and fixed Sanity hero artwork for the four legacy blog routes observed
  in the crawl (`interactive-product-demo`, `create-better-interactive-demos`,
  `leveraging-interactive-demos`, and `how-supademo-uses-supademo`).
- Expanded free-tool detail data so every captured `/tools/*` URL renders its own bounded page.
- Added route-specific heading and metadata alignment for the captured AI-agent, feature, blog,
  enterprise, and free-tool pages, including the public `/login` alias for the shared sign-in flow.
- Kept route metadata server-safe by duplicating only the small industry title/description map in
  the metadata module instead of importing the client-only industry component.
- Added fixed, reference-hosted hero artwork for feature and customer detail previews, with
  `referrerPolicy="no-referrer"` and no user-controlled image source.
- Added shared responsive preview, outcome, step, quote, and CTA layouts with reduced-motion handling.
- Fixed local authentication from the desktop/LAN browser origin by including the exact
  development origin `http://10.2.13.175:3000` in local/test CORS defaults.
- Auth client errors now parse bounded public API error messages instead of hiding origin and
  validation failures behind a generic message.
- Kept route selection allowlisted through the existing catch-all route; unknown identifiers continue to use the existing bounded fallback.

Files changed:

- apps/web/app/[...slug]/page.tsx
- apps/web/components/marketing-feature-detail.tsx
- apps/web/components/marketing-customer-detail.tsx
- apps/web/components/marketing-industry.tsx
- apps/web/components/marketing-content-page.tsx
- apps/web/components/marketing-blog.tsx
- apps/web/components/marketing-report.tsx
- apps/web/components/marketing-reference-page.tsx
- apps/web/components/marketing-tool-detail.tsx
- apps/web/components/marketing-ai-agents.tsx
- apps/web/components/marketing-ai.tsx
- apps/web/components/marketing-academy.tsx
- apps/web/components/marketing-showcase.tsx
- apps/web/components/marketing-tutorials.tsx
- apps/web/components/marketing-help.tsx
- apps/web/components/marketing-enterprise.tsx
- apps/web/components/marketing-pricing.tsx
- apps/web/app/pricing/page.tsx
- apps/web/components/auth-screen.tsx
- apps/web/app/login/page.tsx
- apps/web/app/ai/page.tsx
- apps/web/app/academy/page.tsx
- apps/web/app/showcase/page.tsx
- apps/web/app/tutorials/page.tsx
- apps/web/app/globals.css
- apps/web/src/lib/auth-client.ts
- packages/config/src/index.ts
- tests/marketing-reference.test.mjs
- tests/tool-detail.test.mjs
- tests/auth-screen.test.mjs
- tests/config.test.mjs
- tests/academy.test.mjs
- tests/ai.test.mjs
- tests/showcase-tutorials.test.mjs
- tests/pricing.test.mjs

Trust boundaries and sensitive data affected:

- Public marketing-page rendering only.
- Auth browser requests and local/test origin configuration were updated; no production origin
  or authentication provider behavior was changed.
- Feature/customer previews reference fixed public Supademo-hosted image URLs, which introduces
  an availability/privacy boundary to those public pages but no user-controlled third-party URL.
- Industry pages use the same fixed reference-hosted hero and preview assets; carousel/tab state is
  client-only and does not cross a tenant or authentication boundary.
- Route slugs are read-only URL inputs and select from static in-memory maps.
- Blog article paths resolve through a normalized, exact-path lookup in the static article catalog;
  no request-controlled content is fetched or rendered.
- The report uses fixed Supademo artwork and bounded in-memory datasets; team, view, and section
  controls only update local UI state and cannot select a tenant or issue a privileged request.
- Product Updates filtering is entirely client-side over the static article catalog; query input is
  bounded and rendered as text, with no dynamic URL fetch or HTML injection.
- The AI, Academy, Showcase, Tutorials, and Help additions remain public, static/client-state
  surfaces. External imagery is fixed to reviewed Supademo/CDN paths; no browser input controls
  those URLs.
- Showcase filters, section expansion, tutorial search, Academy carousel state, and guide-card
  actions are local UI state only; they do not grant access to workspace data or call privileged
  APIs.

Authorization model:

- Public pages expose only static marketing content.
- Signup and request-demo actions remain links to the existing authenticated or contact flows.
- No protected workspace operation is introduced by this change.

Threats considered:

- Route-slug injection, open redirects, unsafe HTML rendering, XSS, SSRF, secret exposure, and accidental access to tenant data.
- Malformed or unknown slugs falling through to unsafe dynamic content.
- Motion or preview visuals affecting reduced-motion users.

Security controls implemented:

- Static allowlisted route maps; unknown slugs use the pre-existing bounded reference page.
- Hero image URLs are hard-coded allowlisted constants and rendered with `referrerPolicy="no-referrer"`.
- No `dangerouslySetInnerHTML`, `innerHTML`, dynamic code execution, user-controlled external URL
  fetch, or shell execution.
- Existing public links use fixed local destinations or existing explicitly reviewed Supademo resources.
- CSS animation is disabled under `prefers-reduced-motion: reduce`.
- The catch-all route validates the route family and only renders detail pages for known two-segment slugs.
- Local CORS defaults remain limited to exact localhost, loopback, and the configured development
  LAN origin; production still requires explicit managed origins.
- Auth error parsing accepts only a bounded public `error.message` field and never logs response bodies.

Security tests added:

- `tests/marketing-reference.test.mjs` verifies feature and customer route wiring, representative allowlisted entries, CSS motion/reduced-motion coverage, and absence of unsafe DOM APIs.
- `tests/marketing-reference.test.mjs` also verifies the four industry route entries, fixed hero
  asset, example-tab surface, and unsafe-DOM exclusions.
- `tests/marketing-reference.test.mjs` verifies the canonical blog article resolver, article hero
  image class, and source-level unsafe-DOM exclusions for the blog catalog and article surface.
- `tests/marketing-reference.test.mjs` verifies the report route dispatch, report controls, and
  source-level unsafe-DOM exclusions.
- `tests/marketing-reference.test.mjs` verifies the blog component's bounded `initialCategory`
  entry point used by the Product Updates route.
- `tests/tool-detail.test.mjs` verifies all captured free-tool slugs have bounded detail entries and no unsafe DOM APIs.
- `tests/auth-screen.test.mjs` verifies bounded auth error parsing and no raw `response.json()`/unsafe DOM paths.
- `tests/auth-screen.test.mjs` also verifies the public `/login` alias uses the shared sign-in screen.
- `tests/config.test.mjs` verifies the exact LAN origin is local-only configuration and that local defaults remain bounded.
- `tests/academy.test.mjs`, `tests/ai.test.mjs`, and `tests/showcase-tutorials.test.mjs` verify the
  new fixed imagery, bounded filters, accessible state, reduced-motion declarations, and absence
  of unsafe DOM execution in the long-page surfaces.
- Existing full auth, tenant-isolation, XSS, SSRF, upload, and CSRF regression tests remain in the suite.

Checks run and results:

- `npx prettier --write ...` (passed on changed files)
- `npm run verify` (passed: formatting, lint, boundary checks, typecheck)
- `npm test` (passed: 432 tests, 1 skipped, 0 failed; 433 total)
- Browser route verification against the 91-entry captured inventory plus 42 feature/customer detail navigations and all four industry routes; all rendered without application errors.
- A follow-up browser smoke sweep covered all 91 captured paths again after the metadata and heading
  alignment pass; the only remaining no-`h1` result was the auth alias, which was corrected with a
  visually hidden page heading and then verified at `/login`.
- Browser interaction smoke coverage for industry example tabs and previous/next preview controls.
- Browser verification of `/blog/supademo-vs-claude-code` and `/blog/product-update-june-recap`
  confirmed canonical titles, Sanity hero images with natural width, author/date metadata, and no
  application alerts.
- Browser verification of `/content/state-of-interactive-demos-2026` confirmed the reference hero,
  four loaded preview assets, 11 report sections, seven team tabs, and working Sales + Table
  interactions with no application alerts.
- Browser verification of `/blog/product-updates` confirmed the canonical metadata, Product Updates
  filter selection, three filtered cards, and no application alerts.
- Browser verification of all four legacy blog paths confirmed their reference titles, loaded 800px
  hero artwork, and no application alerts.
- Browser signup flow at `http://10.2.13.175:3000/signup` using a synthetic `.invalid` email; account creation and automatic sign-in redirected to `/home`.
- LAN-origin API smoke request verified `200` with `access-control-allow-origin: http://10.2.13.175:3000`.
- Impeccable detector ran; it reported pre-existing unrelated global CSS warnings (side-tab accents, Arial, and a legacy tiled background), not introduced by the detail/auth changes.
- The final Impeccable detector pass over the updated UI reported only those same pre-existing
  global warnings; no new finding was emitted from the AI, Academy, Showcase, Tutorials, or Help
  component changes.
- `git diff --check` (passed)

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and infrastructure policy scans were not run in this UI-only change because the repository does not expose configured commands for them in the current environment. Claude or CI should run the project-approved scanners before release.
- Visual pixel-diff against the live Supademo site was not run; the implementation was verified through the captured route inventory and local browser screenshots.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Hero artwork is loaded from fixed public Supademo URLs; if those assets change or become unavailable, the page falls back to the surrounding frame but visual fidelity can drift.
- Industry preview assets are intentionally remote fixed references; a remote outage degrades imagery but
  does not affect navigation, authorization, or user data.
- The LAN CORS default is intentionally tied to the current desktop development address and should be replaced with an explicit environment value when the address changes.
- The `/login` route is an alias, not a second authentication implementation; it intentionally
  shares the existing CSRF-protected client and local provider behavior.
- The route inventory covers the pages observed during the browser crawl; newly launched Supademo routes would need to be added to the maps.
- Public thumbnails and Academy/tutorial artwork are intentionally sourced from Supademo's public
  CDN/API paths. A provider-side asset change or outage can change the visual result without
  changing application authorization or exposing customer data.
- The local Showcase catalog uses bounded representative card destinations for the static reference
  examples; it does not recreate Supademo's authenticated demo-player data service.

Pricing parity additions (this pass):

- Rebuilt the `/pricing` surface from the captured Supademo reference: four plan cards, bounded
  seat steppers, usage-based AI Demo Agent add-on, trust/comparison band, all nine comparison
  groups, and the FAQ accordion.
- Added fixed local signup/product-demo links, static reviewed logo/artwork URLs, and responsive
  reduced-motion-safe layout rules. Pricing controls are client-only and do not mutate account,
  billing, or workspace state.
- Added `tests/pricing.test.mjs` for route metadata, reference copy, local destinations, bounded
  controls, unsafe-rendering exclusions, and reduced-motion CSS coverage.

Pricing-specific trust boundaries and residual risks:

- Pricing is public, read-only marketing content. The plan, comparison, FAQ, and seat-stepper state
  is local browser state only; no identity, tenant, payment, or privileged API boundary is crossed.
- All pricing links and remote image URLs are fixed constants. They are not derived from query
  strings or user input, so the implementation does not create an open-redirect or user-controlled
  SSRF path. Fixed remote assets remain an availability/privacy dependency for public visitors.
- Seat counts are clamped to 1..10 and comparison/FAQ state is keyed only by static in-memory data.
  The component does not use unsafe DOM APIs, dynamic code execution, or raw HTML rendering.
- The Impeccable detector still reports only the repository's pre-existing global CSS warnings
  (legacy side-tab borders, Arial, and a tiled grid background); it reported no new pricing warning.

Authenticated Home parity addition (this pass):

- Replaced the synthetic June update illustration on `/home` with the fixed reference artwork,
  corrected the Supademos and Demo agents destinations, and linked the recap CTA to the canonical
  Product Updates article.
- Added a bounded artwork-reveal entrance using transform/opacity only; the `prefers-reduced-motion`
  rule disables it without hiding content.
- The image URL is a reviewed constant with `referrerPolicy="no-referrer"`; it is not user or
  query controlled. The Home surface still only exposes local navigation and read-only client
  state, so no tenant, auth, or privileged API boundary changed.
- `tests/home-sections.test.mjs` now covers the fixed asset, destination links, and motion hook.
- Collection cards and the Screenshot, Video, and Showcase feature panels now use fixed reviewed
  Supademo media URLs instead of synthetic wireframes; images are lazy-loaded, decorative, and
  referrer-free. The media host is an availability/privacy dependency only, not a user-controlled
  fetch target.

Cross-tab authentication remediation (this pass):

- Public account and recovery operations (`sign-up`, `verify-email`, `sign-in`, `forgot-password`,
  and `reset-password`) no longer require a tab-scoped CSRF token when an existing HttpOnly session
  cookie is present. This fixes fresh-tab account creation/login while keeping session refresh,
  sign-out, and protected application mutations CSRF-bound.
- The exemption is an exact allowlist of versioned auth paths parsed from the request URL; it does
  not weaken origin validation, cookie flags, rate limiting, authentication, or tenant checks.
- `tests/api.test.mjs` now exercises sign-up and sign-in with an active session cookie and no CSRF
  header, then proves refresh still requires and accepts the newly issued token.
- Browser verification reproduced the prior 403 in a stale running process, restarted the local API,
  and then confirmed a fresh browser tab can create an account and redirect to `/home` without an
  application error.

Product-demo reference parity addition (this pass):

- Rebuilt `/product-demo` around the measured live Supademo split geometry: a 527px form column,
  avatar stack, bounded name/email/goal inputs, and a full-width dark proof rail.
- Added a fixed, reviewed proof-card catalog and trust-logo strip using Supademo-hosted public assets;
  the carousel repeats a static allowlisted sequence and animates with a reduced-motion fallback.
- Form submission remains local-only and bounded: invalid input produces a generic alert, valid input
  produces a local confirmation state, and the instant-demo action remains a fixed `/signup` link.
- `tests/product-demo.test.mjs` now covers the avatar stack, fixed proof assets, repeated carousel
  track, trust-logo grid, bounded inputs, reduced-motion CSS, and unsafe-DOM exclusions.

Product-demo trust boundaries and residual risks:

- The page is public and does not read tenant data or issue privileged requests. All external asset
  URLs are hard-coded Supademo paths with `referrerPolicy="no-referrer"`; they are availability and
  privacy dependencies, not user-controlled fetch targets.
- The proof rail is decorative/client-only; its animation is disabled for reduced-motion users. No
  HTML, script, URL, or CSS value is derived from form input.
- The local confirmation state is not a lead-submission backend. Connecting it to a production CRM or
  email workflow would require a separately reviewed authenticated/rate-limited endpoint.

Latest checks after the cross-tab auth and product-demo passes:

- `npm run verify` (passed: formatting, lint, boundary checks, typecheck)
- `npm test` (passed: 433 tests, 1 skipped, 0 failed; 434 total)
- `git diff --check` (passed)
- Browser: `/product-demo` measured at 1280×720; form geometry, carousel card positions, all 25 proof/trust
  images, invalid/valid form states, and the fixed signup link were verified with no application alerts.
- Impeccable detector: only the same pre-existing global warnings (legacy borders, Arial, tiled route
  canvas) remain; no product-demo-specific finding was emitted.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Final crawl and verification handoff:

Change summary:

- Completed the public Supademo reference crawl and organized the route inventory, control outcomes,
  complete-page screenshots, and local/reference comparison artifacts under
  `docs/reference-crawl/supademo-2026-08-01/`.
- Covered 91 discovered routes (89 public `supademo.com` routes plus the public `/login` and `/signup`
  application screens) and saved a full-height PNG for every route.
- Retried the transient interaction errors in a fresh browser session; 16 of the original 18 erroring
  controls were subsequently exercised. The two remaining cases are documented in the crawl README.

Files changed or added for this pass:

- `docs/reference-crawl/supademo-2026-08-01/README.md`
- `docs/reference-crawl/supademo-2026-08-01/route-inventory.json`
- `docs/reference-crawl/supademo-2026-08-01/button-actions.json`
- `docs/reference-crawl/supademo-2026-08-01/screenshots/*.png`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/**/*.png`

Trust boundaries and sensitive data affected:

- The browser crawl touched public marketing pages and unauthenticated auth screens, plus local
  deterministic authenticated-reference fixtures. No credentials, cookies, passwords, production
  workspace records, uploads, or private API responses were collected.
- Embedded demos were inventoried but not recursively driven; they remain separate content trust
  boundaries.

Authorization model:

- No application authorization or data-access behavior was changed by the crawl artifacts.
- Authentication, OAuth, account creation, publish/create, download/copy, permission, and other
  externally side-effectful controls were intentionally not submitted or invoked.

Threats considered:

- Accidental account creation, authentication, publishing, external messaging, downloads, clipboard
  writes, browser permission prompts, and destructive mutations during control coverage.
- Secret and personal-data exposure through screenshots, URLs, logs, or page state.
- Treating stale labels or unreachable sticky controls as successfully exercised.

Security controls implemented:

- Reversible navigation, accordions, tabs, filters, carousels, menus, and list controls were exercised
  and their observed URL/dialog/menu/expanded state was recorded.
- Side-effectful controls were classified and preserved as `skipped` with a reason in
  `button-actions.json`; no browser permission or credential prompt was accepted.
- Screenshots and manifests live under `docs/` and are not served by the application runtime.

Security tests added or updated:

- Existing route-specific tests cover the local surfaces and unsafe-DOM exclusions; the crawl itself
  is represented by the route inventory, control log, screenshot set, and local collection manifest.
- Verification scripts confirmed every inventory entry has an associated screenshot and that the JSON
  artifacts parse successfully.

Checks run and results:

- `npm run verify` — passed (formatting, lint, boundaries, and typecheck).
- `node --test tests` — passed: 435 tests, 434 passed, 1 skipped, 0 failed.
- `git diff --check` — passed.
- JSON integrity check — passed for `route-inventory.json`, `button-actions.json`, and
  `local-collection/manifest.json`.
- Screenshot coverage check — passed: 91 of 91 route screenshots present; PNGs are full-height captures.

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, IaC policy scans, and a
  production-authenticated tenant-isolation review were not available/configured in this environment.
  Claude or CI must run the project-approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The report intentionally does not claim that every button was activated: 431 controls were skipped
  because activation could submit data, start authentication, create/publish content, download/copy
  content, or otherwise cause an external side effect; 84 stale-after-reload and 31 dynamic/not-found
  matches remain recorded.
- The browser crawl is a point-in-time public-site snapshot. Dynamic experiments, geo/device variants,
  third-party availability, and controls inside embedded demos may change after capture.
- Claude security review is still required by repository policy; this handoff is not an approval.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Help surface fidelity pass:

Change summary:

- Matched `/help` to the live 1280×720 support launcher: the compact public header, four support
  destinations, framed product-tour artwork, and fixed tour CTA.
- Removed local-only direct-support/footer content that is not rendered on the current public route.
- Captured paired live/local screenshots and measured a 761px local body against the 761px live surface.

Files changed:

- `apps/web/components/marketing-help.tsx`
- `apps/web/app/globals.css`
- `tests/help.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/help-top.png`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/help-live-top.png`

Trust boundaries and sensitive data affected:

- Public support content only; no tenant records, uploads, authenticated mutations, or privileged
  operations were added.
- The tour image and CTA point to fixed reviewed Supademo HTTPS destinations; support links include
  fixed documentation, feedback, and status origins.

Authorization model:

- No new protected operation. All links are compile-time constants; destination authorization remains
  with the linked public/application services.

Threats considered:

- Open redirect/SSRF through support and tour URLs, XSS through support copy/image markup, and
  external referrer leakage from the public artwork.

Security controls implemented:

- Support labels, hrefs, and artwork source are fixed constants; no user input reaches navigation or
  markup. The preview image is passive and the CTA uses an explicit fixed target.
- No `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or dynamic code execution was added.

Security tests added or updated:

- `tests/help.test.mjs` asserts fixed docs/status/tour destinations, the framed tour art, and unsafe-
  DOM exclusions.
- Browser checks opened each four support links and the tour CTA in the reviewed live/local states.

Checks run and results:

- `node --test tests/help.test.mjs` (pending final combined run)
- `npm run verify` (pending final combined run after this route update)
- `git diff --check` (pending final combined run)

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because the repository has no configured commands for them in this environment; Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The framed tour image and external support destinations depend on Supademo/third-party availability;
  mirror approved assets if external transfer is not acceptable.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Academy fidelity and interaction pass:

Change summary:

- Matched `/academy` to the public reference geometry at a 1280×720 viewport, including the
  seven-card playbook carousel, four-card guide/training grid, dark course CTA, and full showcase
  footer.
- Added the three fixed video-guide dialogs with YouTube-nocookie embeds and an accessible close
  control, plus the live-training destination card.
- Captured paired live/local screenshots for each scroll state and a local guide modal.

Files changed:

- `apps/web/components/marketing-academy.tsx`
- `apps/web/app/globals.css`
- `tests/academy.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/academy/*.png`

Trust boundaries and sensitive data affected:

- The page is public educational content; it does not read tenant data, accept uploads, or perform
  privileged mutations.
- The video modal embeds fixed YouTube-nocookie origins; the live-training link opens a fixed
  Supademo route in a new tab.

Authorization model:

- No protected operation was introduced. Course, playbook, footer, login, and signup links are fixed
  public/auth routes; guide state is local React state only.

Threats considered:

- XSS/SSRF through guide copy, image sources, iframe sources, and external link destinations.
- Modal focus/escape regressions and accidental navigation from guide controls.
- Privacy leakage through third-party image referrers and video embeds.

Security controls implemented:

- Playbook copy, image paths, video IDs, and hrefs are compile-time constants; no user input reaches
  markup or navigation.
- External headshot images use `referrerPolicy="no-referrer"`; video embeds use the fixed
  `youtube-nocookie.com` host and a fixed allowlist of three IDs.
- The modal is a native `role="dialog"` with `aria-modal`, labelled caption, and an explicit
  `Close video` button. Carousel edges are bounded and disabled.
- No `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or dynamic code execution was added.

Security tests added or updated:

- `tests/academy.test.mjs` asserts the bounded carousel, training destination, fixed video host,
  close control, showcase footer, CSS modal, and unsafe-DOM exclusions.
- Browser checks exercised previous/next, each guide dialog, modal close, and the training link;
  local body height measured 3,223px versus 3,224px live.

Checks run and results:

- `node --test tests/academy.test.mjs` (passed)
- `npm run verify` (pending final combined run after this handoff update)
- `git diff --check` (pending final combined run)
- Impeccable detector: run in the final combined pass; existing repository-wide warnings are known.

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because the repository has no configured commands for them in this environment; Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The video and training destinations depend on third-party Supademo/YouTube availability. Mirror
  approved media or proxy it through a controlled origin if that transfer is not acceptable.
- The academy remains a deterministic public fixture; authentication and tenant authorization belong
  to the linked application routes and were not changed here.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Careers page fidelity pass:

Change summary:

- Restored the live careers page pacing across hero/gallery, impact, open roles, team story, and the
  showcase CTA/footer, keeping the reviewed bounded photo controls and safe fixed anchors.

Files changed:

- `apps/web/components/marketing-careers.tsx`
- `apps/web/app/globals.css`
- `tests/careers.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/careers-top.png`

Trust boundaries and sensitive data affected:

- Public employer-brand content only; no tenant data, uploads, authenticated requests, or privileged
  mutations.
- Team photography is fixed public Supademo artwork loaded with the existing no-referrer policy.

Authorization model:

- No protected operation was introduced. Gallery controls are local; role/company links are fixed
  destinations.

Threats considered:

- Open redirects/XSS through role hrefs, external-image referrers, unbounded gallery state, and privacy
  leakage in team metadata.

Security controls implemented:

- Compile-time allowlisted hrefs/assets, bounded photo index, native buttons/anchors, no-referrer image
  policy, and no unsafe DOM or dynamic code execution.

Security tests added or updated:

- `tests/careers.test.mjs` asserts the gallery/roles contract, reviewed founder asset, showcase footer,
  and unsafe-DOM exclusions.
- Browser comparison captured the hero and measured local 5,807px body height against live 5,548px
  (the stable 96px local chrome offset remains documented across public routes).

Checks run and results:

- `node --test tests/careers.test.mjs` (pending final combined run)
- `npm run verify` (passed before this route's final combined run)
- `git diff --check` (passed for the route pass)

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because this repository has no configured commands for them in this environment; Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Public team photography remains an external availability/privacy dependency and should be mirrored or
  consent-reviewed before production use.
- This page is a marketing fixture; job application processing is outside this route.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Accessibility statement fidelity pass:

Change summary:

- Matched `/accessibility` to the reviewed long-form statement by restoring the live reading height,
  keeping fixed section navigation and VPAT/contact destinations, refining desktop title wrapping, and
  using the showcase footer CTA/footer rhythm.

Files changed:

- `apps/web/components/marketing-accessibility.tsx`
- `apps/web/app/globals.css`
- `tests/accessibility-page.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/accessibility-top.png`

Trust boundaries and sensitive data affected:

- Public policy content only; no tenant data, uploads, authenticated requests, or privileged mutations.
- Contact links expose only the published accessibility mailbox.

Authorization model:

- No protected operation was introduced. Section navigation is local state; links target fixed public
  documentation/help/mail destinations.

Threats considered:

- Open redirects/XSS through policy links, unsafe scrolling targets, accidental collection of contact
  data, and motion/focus regressions in the section navigator.

Security controls implemented:

- Compile-time allowlisted IDs and hrefs, native buttons, bounded section map, and no unsafe DOM or
  dynamic code execution. Showcase footer remains a static local fixture.

Security tests added or updated:

- `tests/accessibility-page.test.mjs` asserts fixed VPAT/contact targets, section navigation, showcase
  footer, and unsafe-DOM exclusions.
- Browser comparison measured local body height 5,225px against live 5,139px and captured the statement
  hero.

Checks run and results:

- `node --test tests/accessibility-page.test.mjs` (pending final combined run)
- `npm run verify` (passed before this route's final combined run)
- `git diff --check` (passed for the route pass)

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because this repository has no configured commands for them in this environment; Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- This page is a static statement and does not certify runtime accessibility of all product surfaces;
  the policy text must be kept current with independent audits.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Use-cases page fidelity pass:

Change summary:

- Matched `/use-cases` to the reviewed public directory rhythm by restoring the live section heights,
  preserving the reviewed hero artwork, team tabs, feature carousel, testimonial toggle, and letting the
  showcase footer own the closing CTA.

Files changed:

- `apps/web/components/marketing-use-cases.tsx`
- `apps/web/app/globals.css`
- `tests/use-cases.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/use-cases-top.png`

Trust boundaries and sensitive data affected:

- Public static marketing content only; no tenant data, uploads, authenticated requests, or privileged
  mutations.
- Hero artwork is fixed HTTPS content loaded with `no-referrer`.

Authorization model:

- No protected operation was introduced. Tabs, carousel, and testimonial toggle are local state; links
  resolve to compile-time fixed public routes.

Threats considered:

- XSS/open redirect through static use-case destinations, unbounded client state, unsafe DOM, and
  external image referrer leakage.

Security controls implemented:

- Fixed mode/feature/link constants, native tabs/buttons, bounded carousel indices, `no-referrer` image
  policy, and no unsafe DOM or dynamic code execution.

Security tests added or updated:

- `tests/use-cases.test.mjs` now asserts the showcase footer contract in addition to tab/carousel/toggle
  semantics and unsafe-DOM exclusions.
- Browser comparison measured local body height 5,327px against live 5,232px and captured the hero.

Checks run and results:

- `node --test tests/use-cases.test.mjs` (pending final combined run)
- `npm run verify` (passed before this route's final combined run)
- `git diff --check` (passed for the route pass)

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because this repository has no configured commands for them in this environment; Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Public Supademo-hosted artwork remains an external availability/privacy dependency.
- Use-case content is static reviewed copy and does not grant access to any application feature.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Enterprise page fidelity pass:

Change summary:

- Matched `/enterprise` to the reviewed live page rhythm with the expanded hero, capability previews,
  trust band, long-form pillars, procurement readiness cards, CTA, six-question FAQ, and showcase
  footer.
- Added the reviewed AI-governance/onboarding FAQ coverage, no-referrer preview images, and local
  screenshots.

Files changed:

- `apps/web/components/marketing-enterprise.tsx`
- `apps/web/app/globals.css`
- `tests/enterprise.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/enterprise-top.png`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/enterprise-middle.png`

Trust boundaries and sensitive data affected:

- Public static enterprise marketing content; no tenant reads, uploads, authenticated requests, or
  privileged mutations.
- Preview artwork is fixed HTTPS content served by Supademo.

Authorization model:

- No protected operation was introduced. Capability/pillar tabs and FAQ state are local; CTAs route to
  the existing product-demo flow or fixed trust-center origin.

Threats considered:

- XSS/open redirects through static CTA and preview values, external-image referrer leakage, and
  accidental claims that marketing copy is an authorization/security control.

Security controls implemented:

- Compile-time allowlists for all preview sources, labels, and routes; native buttons/tabs/details;
  `no-referrer` on external previews; no unsafe DOM or dynamic code execution.

Security tests added or updated:

- `tests/enterprise.test.mjs` asserts capability/pillar semantics, expanded FAQ coverage, fixed CTA
  destinations, showcase footer, and unsafe-DOM exclusions.
- Browser verification compared live/local geometry and exercised the capability preview state.

Checks run and results:

- `node --test tests/enterprise.test.mjs` (passed)
- `npm run verify` (passed before the final combined run)
- `git diff --check` (passed for the route pass)

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because this repository has no configured commands for them in this environment; Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Public Supademo-hosted artwork remains an external availability/privacy dependency; mirror approved
  assets to a controlled CDN if required.
- All enterprise capabilities remain a deterministic marketing fixture and do not grant enterprise
  entitlements to application users.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Compare page fidelity pass:

Change summary:

- Reworked `/compare` to mirror the reviewed Supademo structure: floating competitor-logo hero,
  trust/company band, alternating reasons, dark comparison-card library, customer proof cards, feature
  carousel, seven-question FAQ, CTA, and matching vertical rhythm.
- Added live-reviewed fixed logos and feature artwork, plus local screenshots and CUA verification.

Files changed:

- `apps/web/components/marketing-compare.tsx`
- `apps/web/app/globals.css`
- `tests/compare.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/compare-top.png`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/compare-middle.png`

Trust boundaries and sensitive data affected:

- Public static marketing content only; no tenant reads, uploads, authenticated requests, or privileged
  mutations.
- Fixed Supademo-hosted logo, illustration, and headshot assets are requested by the browser.

Authorization model:

- No protected operation was introduced. Category, show-more, carousel, and FAQ state is local. Card
  and CTA destinations are compile-time fixed public routes.

Threats considered:

- XSS/open redirects through card destinations and labels, unsafe external image refs, unbounded list
  growth, and accidental exposure of private data in proof content.

Security controls implemented:

- Compile-time allowlists for all routes, logos, copy, and categories; bounded comparison reveal and
  carousel indices; `no-referrer` on external images; native buttons/details; no unsafe DOM or dynamic
  code execution.

Security tests added or updated:

- `tests/compare.test.mjs` asserts category/show-more/carousel/FAQ contracts, fixed comparison routes,
  reviewed proof sections, external-image policy, and unsafe-DOM exclusions.
- Browser verification compared live/local geometry (local body height 8,191px vs live 8,207px) and
  captured hero and trust/reasons states.

Checks run and results:

- `node --test tests/compare.test.mjs` (passed)
- `npm run verify` (passed)
- `git diff --check` (pending final combined run)

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because this repository has no configured commands for them in this environment; Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Public Supademo-hosted artwork remains an external availability/privacy dependency; mirror approved
  assets to a controlled CDN if required.
- The comparison library is a reviewed static fixture, not a live alternative-content service.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Tutorial directory fidelity pass:

Change summary:

- Updated `/tutorials` to the reviewed Supademo page-1 inventory (20 fixed cards across Ahrefs and
  Airtable), the full bounded tool-chip directory, search, pagination, tutorial detail links, and the
  showcase footer rhythm.
- Captured top and lower local reference screenshots after CUA verification of tool filtering and
  pagination.

Files changed:

- `apps/web/components/marketing-tutorials.tsx`
- `apps/web/app/globals.css`
- `tests/tutorials.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/tutorials-top.png`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/tutorials-lower.png`

Trust boundaries and sensitive data affected:

- This is public static marketing content. It has no tenant reads, uploads, authenticated requests, or
  privileged mutations.
- Reviewed artwork is loaded from fixed HTTPS image paths; card routes are fixed local paths.

Authorization model:

- No protected operation was introduced. Search, tool chips, and pagination only change local
  presentation state; tutorial links resolve to fixed public detail routes.

Threats considered:

- XSS or open navigation through card/tool values, SSRF or referrer leakage through image URLs, unbounded
  query input, null image handling, and unsafe DOM APIs.

Security controls implemented:

- Compile-time card/tool/link data, an 80-character search bound, fixed `/tutorials/:tool/:slug` paths,
  `no-referrer` image policy, native button semantics, and no `innerHTML`, `dangerouslySetInnerHTML`,
  `eval`, or dynamic code execution.

Security tests added or updated:

- `tests/tutorials.test.mjs` asserts bounded search, selected tool semantics, pagination labeling and
  bounds, fixed detail slugs, footer variant, placeholder styling, and unsafe-DOM exclusions.
- Browser CUA checks selected Airtable and advanced from page 1 to page 2 while confirming 11 bounded
  cards and `aria-selected` state.

Checks run and results:

- `node --test tests/tutorials.test.mjs` (pending final combined run)
- `npm run verify` (pending final combined run)
- `git diff --check` (pending final combined run)
- Impeccable detector: only the existing repository-wide side-tab/Arial findings remain.

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because this repository has no configured commands for them in this environment; Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Only the reviewed page-1 card inventory is reproduced; later pagination pages intentionally reuse the
  bounded local fixture and do not claim a live content API.
- Public Supademo-hosted artwork remains an external availability/privacy dependency.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

AI marketing fidelity pass:

Change summary:

- Matched the live `/ai` route's full-height showcase footer and verified the page body height and
  section geometry against the public reference at 1280×720.
- Kept the existing deterministic AI feature/toolkit content and fixed destination links, adding the
  local full-page capture and control entry to the reference collection.

Files changed:

- `apps/web/components/marketing-ai.tsx`
- `tests/ai.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/ai.png`

Trust boundaries and sensitive data affected:

- The AI marketing page is public, client-rendered content with no tenant reads, uploads, privileged
  mutations, or authenticated requests.
- AI artwork and company logos are fixed reviewed HTTPS URLs and are not user-controlled fetch targets.
- Toolkit links are compile-time allowlisted route strings.

Authorization model:

- No new protected operation or authorization boundary was introduced. CTA links use existing public
  demo-agent, feature, product-demo, and signup flows.

Threats considered:

- XSS/SSRF through image sources, alt text, tool titles, or link destinations.
- Misrepresenting marketing fixture data as authorization or AI output.
- Privacy leakage from external image referrers and keyboard/reduced-motion regressions.

Security controls implemented:

- Static arrays provide all copy, assets, labels, and destination paths; no query/form input reaches
  markup, a fetch target, or a server operation.
- No `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or dynamic code execution was added.
- Native links and existing reduced-motion styles remain in use; external images are fixed and reviewed.

Security tests added or updated:

- `tests/ai.test.mjs` now asserts the showcase-footer variant and existing unsafe-DOM exclusions.
- Browser verification measured a local body height of 6,651px, matching the live `/ai` route, and
  exercised the public CTA destinations without submitting forms.

Checks run and results:

- `npm run verify` (passed)
- `node --test tests` (passed: 435 tests, 434 passed, 1 skipped, 0 failed)
- `git diff --check` (passed)
- Impeccable detector (three pre-existing repository-wide findings: two side-tab borders and Arial;
  no AI-route-specific finding)

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because this repository has no configured commands for them in this environment; Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The route intentionally references public Supademo-hosted artwork for fidelity; mirror approved
  assets to a controlled CDN if external availability or third-party transfer is unacceptable.
- AI feature copy is presentation-only and must not be treated as a model response or permission grant.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Pricing fidelity pass:

Change summary:

- Matched the live pricing page's lower-page structure with the two-row testimonial proof grid,
  full-width FAQ band, default-open FAQ, and showcase footer.
- Matched desktop section geometry at 1280px, including comparison, testimonials, FAQ, and footer
  heights, and preserved responsive fallbacks for smaller viewports.
- Added fixed Supademo-hosted testimonial headshots, logos, and FAQ illustration for visual parity.

Files changed:

- `apps/web/components/marketing-pricing.tsx`
- `apps/web/app/globals.css`
- `tests/pricing.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/README.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/local-pricing-lower.png`

Trust boundaries and sensitive data affected:

- The pricing route is a public, client-rendered marketing surface. It does not read tenant data,
  accept uploads, issue authenticated requests, or perform privileged mutations.
- Testimonial links, headshots, logos, and the FAQ illustration are fixed reviewed HTTPS URLs;
  they are external availability/privacy dependencies and are not user-controlled fetch targets.
- Billing, creator-seat, comparison, and FAQ state is local presentation state only.

Authorization model:

- No new protected operation or authorization boundary was introduced. Plan and request-demo links
  continue to use the existing signup/auth routes; customer-story links are fixed destinations.

Threats considered:

- XSS or SSRF through testimonial metadata, image sources, FAQ copy, or link destinations.
- Accidental mutation or authorization claims from pricing controls.
- Privacy leakage through referrers sent to external image hosts.
- Keyboard and reduced-motion regressions in switch, steppers, comparison accordions, and FAQ.

Security controls implemented:

- Testimonial records and all external URLs are compile-time constants; no query string or form input
  reaches markup, a fetch target, or a server operation.
- Images use fixed HTTPS sources, descriptive alt text, lazy loading, and `referrerPolicy="no-referrer"`.
- Billing and seat controls use native buttons/switch semantics with bounded numeric state; FAQ and
  comparison controls expose `aria-expanded` and are keyboard operable.
- No `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or dynamic code execution was added.
- Pricing animations remain covered by the existing reduced-motion overrides.

Security tests added or updated:

- `tests/pricing.test.mjs` asserts the testimonial/FAQ/footer structure, fixed asset references,
  pricing controls, unsafe-DOM exclusions, and reduced-motion CSS.
- Browser verification toggled annual billing, changed Scale creator seats up and down, collapsed and
  restored a comparison section, and closed/reopened the default FAQ.

Checks run and results:

- `npx prettier --write tests/pricing.test.mjs` (passed)
- `npm run verify` (pending final combined run)
- `node --test tests` (pending final combined run)
- `git diff --check` (pending final combined run)
- Browser pricing geometry and interaction checks at 1280×720 (passed; local body height 12,357px,
  matching the live reference measurement).

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because this repository has no configured commands for them in this environment; Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The pricing page intentionally references public Supademo-hosted assets for visual parity. A
  production deployment should mirror approved assets to a controlled CDN if external availability or
  third-party transfer is unacceptable.
- Plan prices and testimonials are deterministic presentation fixtures; they must not be used as the
  source of truth for billing, entitlements, or customer authorization.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Showcase parity pass (2026-08-02)

SECURITY REVIEW REQUEST

Change summary:

- Rebuilt the public `/showcase` catalog to match the captured Supademo layout and interaction states.
- Added bounded demo-type, industry, and use-case filters; deterministic Show more/Show less expansion;
  reviewed static card destinations; and a showcase-specific footer CTA.
- Added local reference screenshots, manifest/control documentation, and regression assertions.

Files changed:

- `apps/web/components/marketing-showcase.tsx`
- `apps/web/components/marketing-chrome.tsx`
- `apps/web/app/globals.css`
- `tests/showcase.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/README.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/showcase*.png`

Trust boundaries and sensitive data affected:

- The route is a public marketing catalog. It does not read workspace data, accept uploads, call APIs,
  or process identity, analytics, or payment data.
- Card artwork and footer artwork are fixed public HTTPS assets loaded with `no-referrer`; an asset outage
  affects presentation only.
- Filter values, card metadata, and expansion content are static constants in the bundle.

Authorization model:

- No privileged operation is introduced. Filter and expansion controls only change local component state.
- Card links are fixed reviewed local/product-demo destinations, and the CTA is a fixed local `/signup` route.
- No client-provided identifier is used for a data lookup or authorization decision.

Threats considered:

- XSS or URL injection through card titles, logos, descriptions, and links.
- SSRF or privacy leakage through externally loaded artwork.
- Open redirects, unbounded filter state, accidental API mutations, and tenant-data exposure.
- Keyboard/focus regressions and reduced-motion accessibility regressions from expansion animation.

Security controls implemented:

- Static allowlists for filter values, card records, local routes, and remote artwork URLs.
- No `innerHTML`, `dangerouslySetInnerHTML`, dynamic code execution, user-controlled fetch target,
  or server-side mutation in the route.
- Checkbox/filter state is bounded to known values; expansion only reveals predeclared records.
- External images use HTTPS and `referrerPolicy="no-referrer"`; motion is disabled under reduced-motion.

Security tests added:

- `tests/showcase.test.mjs` asserts bounded filters/expansion, static card markup, footer assets,
  local signup routing, and the absence of unsafe DOM/code-execution APIs.
- Browser checks exercised filter-group toggles, category checkboxes, Show more/Show less, cards,
  and footer CTA after a fresh DOM snapshot.

Checks run and results:

- `npm run format` (pending for this final documentation/test edit; run before merge).
- `npm run verify` (pending for this final documentation/test edit; run before merge).
- `node --test tests` (pending for this final documentation/test edit; run before merge).
- `git diff --check` (pending for this final documentation/test edit; run before merge).
- Impeccable detector (pending for this final CSS/component edit; run before merge).

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans are not
  configured in this environment; Claude/CI should run the approved project scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Remote marketing images remain an availability and third-party-content dependency; they are not trusted
  as executable application content.
- The route is a deterministic visual catalog, not a substitute for backend authorization tests on the
  authenticated workspace surfaces.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Integrations directory parity pass (this pass):

Change summary:

- Matched the public `/integrations` hero, filter/library geometry, seven integration groups,
  CTA copy/artwork, and footer envelope to the live Supademo reference at the 1280px capture width.
- Expanded the browser-verifiable filter state with a bounded category radio list and a clear-filter
  control, and stored top/CTA screenshots in the organized local collection.

Files changed:

- `apps/web/components/marketing-integrations.tsx`
- `apps/web/app/globals.css`
- `tests/integrations.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/README.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/integrations.png`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/integrations-cta.png`

Trust boundaries and sensitive data affected:

- This is a public, static marketing directory. It adds no authenticated API calls, tenant data,
  uploads, analytics ingestion, or privileged mutations.
- Integration names, descriptions, slugs, destination paths, and category values are compile-time
  constants. The CTA artwork is fetched from a fixed HTTPS Supademo URL and has no access to local
  application credentials.

Authorization model:

- No new protected operation was introduced. The page only changes local filter state and routes to
  existing public signup, request-demo, and fixed integration detail destinations.
- Integration detail routes must remain public marketing pages; they must not be used as evidence of
  workspace authorization or entitlement.

Threats considered:

- XSS or open redirect through integration slugs, labels, query strings, or externally loaded artwork.
- SSRF or referrer leakage through the CTA image.
- Unbounded filter input, unsafe DOM APIs, and motion/focus regressions in the category control.
- Accidental mutation or tenant-data exposure from marketing CTA destinations.

Security controls implemented:

- Static groups and slugs are rendered through React text nodes and fixed relative paths; no
  `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or dynamic fetch target was added.
- Native radio inputs, bounded state, `aria-expanded`, and `aria-live` keep filtering predictable and
  keyboard accessible. `Clear filter` returns to the complete seven-group allowlist.
- The CTA image uses a fixed HTTPS URL, lazy loading, `referrerPolicy="no-referrer"`, and an empty
  decorative alt value; it is not a user-configurable fetch target.
- The directory and CTA animation rules include an explicit `prefers-reduced-motion: reduce` override.

Security tests added or updated:

- `tests/integrations.test.mjs` now asserts the CTA copy/artwork, fixed referrer policy, category
  controls, clear-filter control, safe relative detail links, and unsafe-DOM exclusions.
- Browser verification exercised category open/close, a single-category filter, clear-filter reset,
  hero/CTA destinations, and the loaded CTA artwork at 1280×720.

Checks run and results:

- `npm run format` (passed)
- `npm run verify` (passed: formatting, lint, workspace boundaries, typecheck)
- `node --test tests` (passed: 434 tests, 433 passed, 1 skipped, 0 failed)
- `git diff --check` (passed)
- Impeccable detector over the changed component/global stylesheet (only four pre-existing global
  warnings: legacy side-tab borders, Arial, and tiled route-canvas background)

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because this repository has no configured commands for them in this environment. Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The CTA artwork remains a reviewed public Supademo-hosted dependency for visual parity. A production
  deployment should mirror approved assets to a controlled CDN if external availability or third-party
  transfer is unacceptable.
- The integration directory is a static reference catalog; production integration enablement still
  requires server-side authorization and tenant-scoped backend checks.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Free-tools directory parity pass:

Change summary:

- Expanded `/tools` from the short local list to the complete 56-item catalog observed on the live
  Supademo directory, including the missing training, video, prototype, onboarding, and document tools.
- Matched the live overlay hero geometry, filter rail, three-column card rhythm, 4,809px directory band,
  and 1,275px footer envelope at the 1280×720 reference viewport.
- Added a bounded Clear all filters action and organized top/directory screenshots and control notes.

Files changed:

- `apps/web/components/marketing-tools.tsx`
- `apps/web/app/globals.css`
- `tests/tools.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/README.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/tools.png`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/tools-library.png`

Trust boundaries and sensitive data affected:

- The route is a public marketing directory with no tenant reads, authenticated requests, uploads, or
  privileged mutations.
- Tool names, descriptions, categories, and slugs are compile-time constants. The route emits no user
  content into HTML and does not fetch user-provided URLs.

Authorization model:

- No new protected operation was introduced. Category selection and Clear all filters only change local
  presentation state. Detail links use fixed `/tools/:slug` destinations.

Threats considered:

- XSS, open redirects, SSRF, and unsafe route interpolation through catalog metadata and detail links.
- Unbounded filter/result state and keyboard/accessibility regressions in the filter rail.
- Motion sensitivity and layout instability from card hover transitions.

Security controls implemented:

- Catalog data is a static allowlist; no `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or dynamic URL
  construction from browser input was added.
- Filter values are an enumerated category union, checkboxes are native controls, and Clear all filters
  returns to the finite 56-card baseline.
- Tool-card hover transitions are explicitly disabled under `prefers-reduced-motion: reduce`.

Security tests added or updated:

- `tests/tools.test.mjs` asserts the bounded category state, fixed detail-link template, 56-catalog
  entries, Clear all filters control, reduced-motion CSS, and unsafe-DOM exclusions.
- Browser verification exercised Explore Free Tools, the AI checkbox (56→2 cards), Clear all filters
  (2→56 cards), and Category collapse/expand after fresh DOM snapshots.

Checks run and results:

- `npm run format` / `npx prettier --write` (passed)
- `npm run verify` (passed: formatting, lint, workspace boundaries, typecheck)
- `node --test tests` (passed: 434 tests, 433 passed, 1 skipped, 0 failed)
- `git diff --check` (passed)
- Impeccable detector over the changed component/global stylesheet (passed with four pre-existing
  repository-wide warnings: side-tab borders, Arial, and tiled route-canvas background; no tools-route
  specific finding).

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because this repository does not expose configured commands in this environment. Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The directory’s card catalog and dimensions are static visual fixtures; they are not a source of truth
  for tool entitlements or authorization.
- The page continues to use the reviewed public Supademo hero asset for reference fidelity; mirror it to
  a controlled CDN if third-party transfer or availability becomes unacceptable.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Customer proof and story-library parity pass:

Change summary:

- Expanded `/customers` into a proof-led hero, bounded story library, metrics band, industry directory,
  and testimonial section matching the measured Supademo layout and vertical rhythm.
- Added fixed customer/logo artwork, industry filters, story-library expansion, testimonial cards, and
  reduced-motion-safe story-grid transitions.
- Added organized local screenshots and control notes for the route, including the Enterprise industry
  state and testimonial section.

Files changed:

- `apps/web/components/marketing-customers.tsx`
- `apps/web/app/globals.css`
- `tests/customers.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/README.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/customers.png`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/customers-industries.png`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/customers-testimonials.png`

Trust boundaries and sensitive data affected:

- The route is a public marketing page and does not read tenant records, accept uploads, issue
  authenticated requests, or perform privileged mutations.
- Customer logos and the proof-card image are fixed HTTPS Supademo-hosted assets with
  `referrerPolicy="no-referrer"`; they are external availability/privacy dependencies, not user-selected
  fetch targets.
- Story, industry, filter, metric, and testimonial values are compile-time constants. No viewer input is
  persisted or sent to an API.

Authorization model:

- No new protected operation was added. Story filters, tab selection, and expansion are bounded local
  presentation state. Story and company links point to fixed local or reviewed HTTPS destinations.

Threats considered:

- XSS/DOM injection through customer copy, logo URLs, filter labels, and testimonial content.
- SSRF or privacy leakage through image/link destinations.
- Accidental authorization claims from presentation-only industry filtering.
- Unbounded result expansion and motion/focus regressions in interactive controls.

Security controls implemented:

- All dynamic-looking values come from static allowlists; no `innerHTML`, `dangerouslySetInnerHTML`,
  `eval`, or dynamic fetch target was introduced.
- Story expansion is capped by the finite static array, and filter categories are native buttons with
  `role="tab"`/`aria-selected` semantics.
- External artwork uses descriptive alt text, fixed HTTPS URLs, and `referrerPolicy="no-referrer"`.
- The story-grid refresh animation is short and explicitly disabled by `prefers-reduced-motion`.

Security tests added or updated:

- `tests/customers.test.mjs` checks bounded story expansion, fixed artwork/destinations, industry tab
  semantics, industry surface/testimonial sections, reduced-motion CSS, and unsafe-DOM exclusions.
- Browser verification exercised the Company Size filter, Use Case filter, Show 7 more expansion
  (12→18 cards), Enterprise industry tab (four rows), and captured the resulting route states.

Checks run and results:

- `npm run format` (passed)
- `npm run verify` (passed: formatting, lint, workspace boundaries, typecheck)
- `node --test tests` (passed: 434 tests, 433 passed, 1 skipped, 0 failed)
- `git diff --check` (passed)
- Impeccable detector over the changed component/global stylesheet (passed with four pre-existing
  repository-wide warnings: side-tab borders, Arial, and tiled route-canvas background; no
  customer-route-specific finding).

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because this repository does not expose configured commands in this environment. Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The proof card and logo grid intentionally use public Supademo-hosted assets for visual parity; a
  production deployment should mirror approved assets to a controlled CDN if third-party transfer or
  availability is unacceptable.
- The directory is a static marketing fixture, not an authorization or customer-record system; its
  labels must never be used as evidence for tenant access or analytics.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Features trust-band fidelity pass (2026-08-02):

Change summary:

- Rebuilt the `/features` trust/proof band to match the captured Supademo geometry: award imagery,
  two-row logo panel, dark texture treatment, responsive sizing, and the surrounding vertical rhythm.
- Added a bounded trust-category listbox (Software, Healthcare, Enterprise, Government & Non-Profit)
  that swaps a fixed logo allowlist and gives visual feedback with a reduced-motion-safe transition.
- Added local screenshots and a control entry for the `/features` route to the organized reference
  collection.

Files changed:

- `apps/web/components/marketing-features.tsx`
- `apps/web/app/globals.css`
- `tests/features.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/features.png`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/features-trust.png`

Trust boundaries and sensitive data affected:

- The route remains a public, client-rendered marketing surface. It does not read tenant data,
  issue authenticated requests, accept uploads, or perform privileged mutations.
- Award and logo images are fixed, reviewed HTTPS URLs and use `referrerPolicy="no-referrer"`.
  They are external availability/privacy dependencies, not user-controlled fetch targets.
- The selector stores only a compile-time category key and selects from a static, bounded asset map.

Authorization model:

- No new protected operation or authorization boundary was introduced. Signup links continue to use
  the existing `/signup` route and the trust selector only changes local presentation state.

Threats considered:

- Untrusted URL or HTML injection through the logo selector, external asset paths, and trust labels.
- DOM-based XSS or unsafe HTML insertion through dynamic category content.
- Keyboard/focus traps and motion sensitivity in the listbox interaction.
- Privacy leakage through referrers sent to external image hosts.

Security controls implemented:

- Category values and image URLs come exclusively from a static `as const` allowlist; no URL,
  category, or markup is derived from query strings or form input.
- Native buttons, `aria-haspopup="listbox"`, `aria-expanded`, `role="listbox"`, `role="option"`,
  and `aria-selected` provide an accessible bounded control. ArrowDown opens the menu and Escape closes it.
- No `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or dynamic code execution was added.
- Images use descriptive `alt`, lazy loading, and `referrerPolicy="no-referrer"`.
- The category swap uses only opacity/translate animation, with an explicit
  `prefers-reduced-motion: reduce` override.

Security tests added or updated:

- `tests/features.test.mjs` asserts the static trust copy, listbox/option semantics, bounded category
  state update, fixed rating assets, trust grid, reduced-motion animation, and unsafe-DOM exclusions.
- Browser verification exercised the feature-format tabs, category menu, Enterprise selection, and
  ArrowDown/Escape keyboard path. The resulting Software trust screenshot has 20 logos and measured
  trust-band height 599.5px, matching the live reference measurement.

Checks run and results:

- `npm run format` (passed)
- `npm run verify` (passed: formatting, lint, workspace boundaries, typecheck)
- `node --test tests` (passed: 434 tests, 433 passed, 1 skipped, 0 failed)
- `git diff --check` (passed)
- Impeccable detector over the changed component/global stylesheet (four pre-existing global warnings:
  legacy side-tab borders, Arial, and tiled route-canvas background; no trust-band-specific finding)

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because this repository has no configured commands for them in this environment. Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The trust rail intentionally references public Supademo-hosted assets for visual parity; a production
  deployment should mirror approved assets to a controlled CDN if external availability or third-party
  transfer is unacceptable.
- The category menu is a presentation control, not a data-backed customer directory; it must not be
  treated as evidence for authorization, analytics, or customer claims.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

Authenticated collection and analytics reference pass (this pass):

Change summary:

- Replaced the authenticated collection placeholders with deterministic reference surfaces for
  `/demos`, `/videos`, `/showcases`, `/hubs`, `/routes`, and `/analytics`.
- Added a reduced-motion-safe SVG views/engagement chart and a Recent Viewers/Recent Accounts
  table switcher on `/analytics`.
- Added a local `/auth` screenshot and a control map alongside the organized browser-crawl artifacts.

Files changed:

- `apps/web/components/workspace-reference-surface.tsx`
- `apps/web/app/globals.css`
- `tests/home-sections.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/README.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/auth.png`

Trust boundaries and sensitive data affected:

- These pages are local authenticated reference fixtures. They do not introduce new API calls,
  storage, tenant lookup, analytics ingestion, upload processing, or privileged mutations.
- Collection thumbnails and feature artwork are fixed reviewed public Supademo URLs with
  `referrerPolicy="no-referrer"`; they are an availability/privacy dependency only.
- Chart paths, table rows, labels, and control destinations are static constants; no browser input
  reaches SVG attributes, HTML, a URL fetch, or a server-side operation.

Authorization model:

- The pages remain behind the existing application authentication shell when used in the local
  workspace. Controls only switch bounded client state or route to local fixtures/status dialogs.
- The earlier cross-tab auth remediation remains in force: public sign-in/sign-up/recovery paths
  are exact-allowlisted, while refresh, sign-out, and protected mutations remain CSRF-bound.

Threats considered:

- Tenant leakage through collection identifiers, IDOR via card actions, XSS through chart/table
  content, URL/SSRF injection through artwork, unsafe SVG execution, and accidental mutation from
  reference controls.

Security controls implemented:

- Static allowlists for collection kinds, card actions, route destinations, chart paths, and table
  rows; no user-controlled `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or dynamic fetch target.
- Inline SVG is decorative/accessible with a bounded `role="img"` label and fixed path data.
- Recent-account and recent-viewer data is local fixture data and is not sourced from telemetry.
- Interactive states expose `aria-pressed`/accessible labels and do not imply authorization.
- Full-page screenshots and the control map are kept outside application runtime paths.

Security tests added or updated:

- `tests/home-sections.test.mjs` asserts the chart role/label, viewer and engagement series,
  reduced-motion chart styles, account table fixture, and Recent Accounts state transition.
- Browser checks exercised every listed visible control on the six collection surfaces after a
  fresh DOM snapshot; `/auth` sign-in/create-account/recovery controls were also inspected.

Checks run and results:

- `npm run verify` (passed after the final artifact-only documentation update).
- `node --test tests` (passed: 433 tests, 1 skipped, 0 failed; 434 total).
- Targeted collection tests (passed after the chart/table assertions were fixed).
- `git diff --check` (passed after the final artifact-only documentation update).
- Browser: `/auth`, `/demos`, `/videos`, `/showcases`, `/hubs`, `/routes`, and `/analytics` opened
  locally at 1280×720; visible controls were exercised and screenshots were captured in
  `docs/reference-crawl/supademo-2026-08-01/local-collection/`.
- Impeccable detector: only the existing repository-wide warnings (legacy side-tab borders,
  Arial, and the tiled route-canvas background) remain; no collection-specific finding was emitted.

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because the repository does not expose configured commands for them in this environment;
  Claude or CI should run the project-approved scanners before release. Screenshot artifacts do not
  change runtime behavior.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The collection pages are deterministic local reference fixtures, not a production replacement
  for Supademo's authenticated data service; production tenant isolation still requires backend
  authorization tests on the real endpoints.
- Some local video/showcase artwork reflects the currently available public Supademo assets and
  may differ from historical screenshots supplied by the user; this does not affect auth or data.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
Features fidelity pass:

Change summary:

- Extended the `/features` route with the image-led Screen Recording, Editing, Personalization,
  Sharing, Collaboration, Analytics, and Explore sections present in the live reference.
- Matched the desktop section heights and full-page rhythm at 1280×720, including the showcase footer,
  and captured a complete local-page PNG.
- Preserved the existing format tabs, audience tabs, trust-category listbox, and sandboxed preview.

Files changed:

- `apps/web/components/marketing-features.tsx`
- `apps/web/app/globals.css`
- `tests/features.test.mjs`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/controls.md`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/manifest.json`
- `docs/reference-crawl/supademo-2026-08-01/local-collection/features-detail.png`

Trust boundaries and sensitive data affected:

- The page remains public marketing content with no tenant reads, uploads, privileged mutations, or
  authenticated requests.
- Feature artwork is loaded from fixed reviewed Supademo HTTPS paths. The existing embedded demo remains
  sandboxed with `allow-scripts allow-same-origin` and does not receive creator-app cookies.
- Detail links are fixed local destinations and do not accept user-provided URLs.

Authorization model:

- No protected operation or authorization boundary was introduced. CTA/detail links use existing public
  routes; the trust selector and tabs only change local presentation state.

Threats considered:

- XSS/SSRF through feature image sources and link destinations.
- Captured HTML sandbox escape via the existing preview iframe.
- Privacy leakage through external image referrers and focus/motion regressions in the listbox/tabs.

Security controls implemented:

- All artwork, copy, categories, and hrefs are compile-time constants; no input reaches markup, fetch
  targets, or privileged operations.
- Existing preview sandbox and `referrerPolicy="no-referrer"` controls are retained on external images.
- Native tabs/listbox semantics and reduced-motion styles remain in use.
- No `innerHTML`, `dangerouslySetInnerHTML`, `eval`, or dynamic code execution was added.

Security tests added or updated:

- `tests/features.test.mjs` continues to assert tab/listbox semantics, the sandbox contract, fixed asset
  sources, and unsafe-DOM exclusions.
- Browser verification switched Guided HTML Demos, Customer Success, and Enterprise trust category;
  local body height measured 11,286px versus 11,287px live.

Checks run and results:

- `npm run verify` (passed before this route's final combined run)
- `node --test tests/ai.test.mjs` (passed)
- `git diff --check` (pending final combined run)
- Impeccable detector: only the existing repository-wide side-tab/Arial findings remain.

Checks not run:

- Secret scanning, dependency audit, Semgrep/CodeQL, container scanning, and IaC policy scans remain
  unavailable because this repository has no configured commands for them in this environment; Claude
  or CI should run the approved scanners before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Public Supademo-hosted artwork is intentionally used for fidelity; mirror approved assets to a
  controlled CDN if third-party transfer or availability is unacceptable.
- Detail sections are static marketing fixtures and must not be treated as product entitlements or
  authorization evidence.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
