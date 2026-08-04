SECURITY REVIEW REQUEST

Change summary:

- Replaced the root route with a public marketing homepage and an in-browser, three-step product-preview interaction.
- Added end-to-end public-home sections for demo formats, use cases, FAQ disclosure, and fixed same-origin calls to action.
- Added the public `/product` route with a capture-to-guided-demo workflow bench and capability previews.
- Moved the existing authenticated workspace home to `/app` and updated workspace navigation, section links, and the UI lab return link to preserve that boundary.
- Added route and rendering tests for the public homepage and updated existing workspace-route tests.

Files changed:

- `apps/web/app/page.tsx`
- `apps/web/app/product/page.tsx`
- `apps/web/app/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/components/marketing-chrome.tsx`
- `apps/web/components/marketing-home.tsx`
- `apps/web/components/marketing-product.tsx`
- `apps/web/components/app-shell.tsx`
- `apps/web/components/ui-lab.tsx`
- `tests/home-sections.test.mjs`
- `tests/app-shell.test.mjs`
- `tests/web.test.mjs`

Trust boundaries and sensitive data affected:

- The root and `/product` routes are public and contain only static, repository-owned copy and local React state.
- The authenticated workspace remains under `/app`; no credentials, API responses, workspace records, or browser-side secret configuration are added to the public page.
- The format and use-case tabs accept no external input beyond bounded local selection state and make no network request.

Authorization model:

- The public marketing pages are intentionally anonymous and their calls to action only navigate to the existing `/auth` route.
- Existing workspace navigation remains inside `/app`, where the existing application authentication and authorization model applies. This change does not create or modify server endpoints or authorization decisions.

Threats considered:

- Accidentally exposing authenticated workspace UI or workspace navigation at the public root.
- Open or stale workspace section links routing visitors back to the public page.
- Client-side script injection through marketing copy, tab state, or FAQ content.
- Navigation to unvalidated external destinations.

Security controls implemented:

- The public page uses local, typed static arrays and React text rendering; it does not use `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic code execution, remote embeds, or network fetches.
- Calls to action use fixed same-origin `/auth` paths; internal workspace section links use fixed `/app?section=…` paths.
- Interactive previews and tabs have bounded local state, native buttons, disabled back navigation at the first step, and explicit accessible selected/pressed states.
- FAQ content uses native `<details>` disclosure controls; no custom focus or script-based disclosure layer was introduced.

Security tests added:

- `tests/home-sections.test.mjs` verifies the public page renders the interactive preview, its fixed authentication actions, and absence of unsafe DOM or dynamic-code APIs.
- `tests/home-sections.test.mjs` also verifies format/use-case tab contracts, FAQ disclosure markup, and the `/product` route.
- `tests/app-shell.test.mjs` verifies workspace links and its shell remain under `/app`.
- `tests/web.test.mjs` verifies the browser baseline contains no client-side database/cache/cloud secret references or unsafe HTML rendering.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed (format check, ESLint, workspace-boundary check, TypeScript and Next route types).
- `npm test` — passed: 397 passed, 1 skipped, 0 failed; includes production web build.
- Impeccable detector on the changed frontend targets — passed with no findings.
- Manual browser QA at `http://10.2.13.175:3000/` — the product-preview Continue control advanced from step 1 to step 2 with updated aria-pressed state; `/app?section=analytics` rendered the workspace analytics view and retained `/app` navigation targets.
- Manual browser QA at `http://10.2.13.175:3000/` — Guided demo → Sandbox and Sales & enablement → Product & growth tabs changed their panel content; FAQ disclosure opened; desktop (1280px) and mobile (390px) checks reported no horizontal overflow.
- Manual browser QA at `http://10.2.13.175:3000/product` — Product route rendered the capture/guide/deliver workflow, marked Product as the current marketing route, and kept fixed auth actions.

Checks not run:

- `npm audit --audit-level=high` was not re-run for this UI-only change. The latest recorded repository review reports three existing high-severity transitive findings in Next.js's PostCSS and optional Sharp dependency chain; no dependency was added or changed by this page work. Run `npm audit --audit-level=high` before release.
- A new local Gitleaks, Semgrep, Trivy/container, and IaC scan was not run. The repository CI provides the applicable scanners; this change adds no dependency, infrastructure, container, or IaC files. Run the CI workflow or the configured scanner commands before release.
- An independent Claude security review has not been performed in this environment and remains required by `AGENTS.md` before merge or release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The public homepage and Product route are functional original implementations; dedicated pricing, customer-story, resources, and legal routes remain future work.
- Its calls to action intentionally stop at the existing auth route; the full authenticated onboarding and live capture flow are separate planned work.
- The existing high-severity dependency-audit findings remain a release blocker until remediated or explicitly accepted in writing by an authorized human with an expiry date.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Final parity verification and dependency remediation addendum (2026-08-01)

SECURITY REVIEW REQUEST

Change summary:

- Completed the final browser-evidence refresh for the live-training page and corrected its header action sizing and metadata.
- Added encoded `@supademohq` handling to the explicit public 404 roots so the local fallback matches the reference site for both URL forms.
- Updated the browser QA documentation to reflect 135 captured local route/query surfaces and 428 inventoried controls.
- Pinned Next's transitive PostCSS and optional sharp resolutions to PostCSS 8.5.23 and sharp 0.35.3, then reified the lockfile.

Files changed:

- apps/web/app/globals.css
- apps/web/app/product-demo/[slug]/page.tsx
- apps/web/app/[...slug]/page.tsx
- package.json
- package-lock.json
- tests/marketing-reference.test.mjs
- browser-qa/supademo-local-2026-07-31/README.md
- docs/reviews/public-marketing-home-security-handoff.md

Trust boundaries and sensitive data affected:

- The route and metadata changes are public, static presentation changes; no authenticated records, credentials, uploads, analytics events, or PII are introduced.
- Dependency overrides affect the build-time Next/PostCSS/sharp toolchain and image processing dependency resolution only; no runtime authorization or storage boundary is changed.

Authorization model:

- Explicit invalid public roots call `notFound()` and never reach a privileged page. Valid public detail routes remain anonymous and their fixed CTAs enter existing auth/product-demo boundaries.
- No new endpoint, permission, workspace lookup, cookie, or session behavior was added.

Threats considered:

- Route confusion from encoded identifiers, fabricated public pages, transitive dependency vulnerabilities, unsafe image/CSS processing, metadata leakage, and accidental submission from browser QA.

Security controls implemented:

- Both literal and encoded `@supademohq` roots are denied by the route allowlist and tested through the browser.
- PostCSS and sharp are pinned to patched versions through the existing Next override and verified in the installed tree.
- No unsafe DOM sink, dynamic code execution, server-side URL fetch, credential logging, or external state-changing request was introduced.
- The browser audit remains non-destructive: ambiguous icon controls and account/booking/submission actions are recorded but not submitted.

Security tests added or updated:

- `tests/marketing-reference.test.mjs` asserts the encoded invalid root is covered.
- Browser smoke verified `/login`, `/resources`, `/article/*`, `/company/*`, `/products/*`, `/detail/*`, `/embed/*`, `/search`, `/new`, `/supademohq`, and `/@supademohq` all render the local 404.
- All existing route/security tests remain green.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed (Prettier, ESLint, boundaries, TypeScript, and Next route types).
- `npm run build` — passed (production Next build and static generation).
- `npm test` — passed: 427 passed, 1 skipped, 0 failed (428 tests total).
- `npm audit --audit-level=high` (and `--omit=dev`) — passed: 0 vulnerabilities after the PostCSS/sharp overrides.
- `npm run security:placeholders` — passed; repository scanner placeholders remain documented.
- Impeccable detector on all newly added/changed route components — passed with `[]` findings.
- `git diff --check` — passed.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license-policy, and dynamic staging scans were not available as local commands; run the repository CI scanners before release.
- Independent Claude security review was not available in this environment and remains required by `AGENTS.md` before merge or release.

Dependencies or infrastructure permissions added:

- No new package. Existing Next dependency resolution is constrained with compatible PostCSS 8.5.23 and sharp 0.35.3 overrides; no IAM, cloud, or infrastructure permission changed.

Known limitations and residual risks:

- Marketing/detail imagery remains served from fixed public Supademo CDN URLs rather than vendored assets with integrity metadata.
- Training calendar, trust metrics, logos, and awards remain local visual approximations/synthetic content; production booking and commercial claims require product/legal/privacy approval.
- The browser pass intentionally does not create accounts, authenticate, upload, publish, export, upgrade, or book a training session. Those flows require separate authorized end-to-end testing.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Deep use-case, free-tool, and live-training parity addendum (2026-08-01)

SECURITY REVIEW REQUEST

Change summary:

- Replaced the generic fallback for seven deep use-case routes with a static, route-keyed Supademo detail surface.
- Replaced the generic fallback for interactive demo builder and interactive walkthrough builder with a dotted utility hero, preview, trust band, education sections, bounded FAQ, and CTA.
- Added a local, bounded live-training calendar for `/product-demo/live-training` with month navigation, date selection, and an existing same-origin handoff.
- Explicitly return the application 404 for legacy/invalid public roots that the reference site also reports as 404, rather than inventing marketing pages.
- Added browser screenshots and action records for all refreshed routes.

Files changed:

- apps/web/components/marketing-use-case-detail.tsx
- apps/web/components/marketing-tool-detail.tsx
- apps/web/components/marketing-live-training.tsx
- apps/web/app/use-cases/[slug]/page.tsx
- apps/web/app/tools/[slug]/page.tsx
- apps/web/app/product-demo/[slug]/page.tsx
- apps/web/app/[...slug]/page.tsx
- apps/web/app/globals.css
- tests/use-case-detail.test.mjs
- tests/tool-detail.test.mjs
- tests/live-training.test.mjs
- tests/marketing-reference.test.mjs
- browser-qa/supademo-local-2026-07-31/165-_.jpg through 184-_.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- All new marketing/detail content is static repository-owned copy and fixed remote image URLs; no workspace data, uploads, analytics, credentials, or server-side URL fetches were added.
- The live-training calendar stores only bounded local UI state (three fixed months and a date integer) and does not submit attendee data.
- The 404-root list affects routing only and prevents arbitrary identifiers from receiving a fabricated public surface.

Authorization model:

- Use-case/tool CTAs navigate to existing `/signup` or `/product-demo` boundaries; no account, workspace, publishing, or lead operation is performed by these pages.
- The training “Continue” link enters the existing product-demo route and does not reserve an external calendar slot.
- Static deep-route content is anonymous and contains no privileged resource lookup.

Threats considered:

- XSS/unsafe markup, untrusted URL interpolation, SSRF, open redirects, unbounded calendar state, accidental lead submission, and viewer-ID disclosure.

Security controls implemented:

- Route data is selected from fixed maps keyed by allowlisted slugs; user-controlled path text is never rendered as executable markup or used as an outbound URL.
- All CTA destinations are fixed same-origin literals. Remote assets are fixed HTTPS Supademo image URLs and rendered as ordinary images.
- Native `details` disclosures and the calendar’s month/date values are bounded; disabled month controls prevent out-of-range navigation.
- No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, fetch, cookies, or third-party scheduler iframe was introduced.
- Invalid legacy roots explicitly call `notFound()` to avoid route confusion.

Security tests added:

- `tests/use-case-detail.test.mjs`, `tests/tool-detail.test.mjs`, and `tests/live-training.test.mjs` verify route wiring, bounded controls, static assets, and unsafe-sink absence.
- `tests/marketing-reference.test.mjs` now covers explicit invalid-root handling.
- Browser QA exercised the seven use-case routes, both tool routes, calendar month/date controls, FAQ disclosures, and captured top/full-page evidence.

Checks run and results:

- Targeted use-case, tool-detail, and live-training tests — passed.
- `npm run build` — passed after the route additions (the dev server was also smoke-tested in-browser).
- Browser smoke — passed with no not-found/error markers on the refreshed valid routes; invalid reference roots now intentionally resolve to the app 404.

Checks not run:

- Final full `npm run verify`, full `npm test`, Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits remain pending after this latest edit.
- Independent Claude security review remains unavailable in this environment and is required by `AGENTS.md` before merge or release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Remote hero/preview images remain dependent on Supademo’s public CDN and are not vendored or integrity-pinned.
- The local training calendar is a visual/interaction approximation and intentionally does not collect or transmit attendee information; production booking requires a separately approved scheduling integration and privacy review.
- Synthetic trust metrics, awards, logos, and FAQ copy require product/legal approval before being treated as verified commercial claims.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Security Trust Center parity addendum (2026-08-01)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/security` Trust Center surface based on the captured `security.supademo.com` reference.
- Added public header actions, gradient trust hero, Overview/Resources/Controls/Media tabs, compliance card, controls grid, and resource states.
- Added browser screenshots and a non-destructive tab interaction inventory for the route.

Files changed:

- apps/web/app/security/page.tsx
- apps/web/components/marketing-security.tsx
- apps/web/app/globals.css
- tests/security-page.test.mjs
- browser-qa/supademo-local-2026-07-31/161-security-top.jpg
- browser-qa/supademo-local-2026-07-31/162-security-full.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- This is an anonymous, static public route. It introduces no workspace records, uploads, analytics payloads, cookies, credentials, or server-side fetches.
- Resource links intentionally leave the local app for the public Trust Center over HTTPS; no user-controlled URL is accepted.

Authorization model:

- The route is public by design. “Request access” enters the existing `/auth?intent=request-demo` boundary; no access is granted by this page.
- Compliance/resource links are fixed external destinations and do not perform privileged operations.

Threats considered:

- XSS/unsafe markup, open redirects, external-link target behavior, unbounded tab state, accidental mutation, and misleading access-control affordances.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, or network request was added.
- Tab state is constrained to the fixed `Overview | Resources | Controls | Media` union.
- External links use fixed HTTPS URLs with `target="_blank"` and `rel="noreferrer"`; same-origin request access goes through the existing auth route.
- The page has visible focusable buttons/links and a mobile layout; the page does not claim to grant access.

Security tests added:

- `tests/security-page.test.mjs` verifies the route, tab state markup, Trust Center copy, control grid, CSS surface, and unsafe-sink absence.
- Browser QA activated all four tabs and captured top/full-page screenshots.

Checks run and results:

- `npm run build` — passed after adding `/security`.
- Browser geometry comparison — passed for header/hero/tabs/content/card coordinates; the refreshed local route is recorded in the QA manifest.
- Targeted `tests/security-page.test.mjs` — pending in the final verification pass.
- Impeccable detector — pending in the final verification pass for this route.

Checks not run:

- Full `npm run verify`, full `npm test`, Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits are pending after the latest route additions; CI should run them before release.
- Independent Claude security review is unavailable in this environment and remains required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The local controls/resources are static reference content and do not represent a live compliance system or verified certification artifacts.
- External Trust Center links are not cloned locally; their availability and content remain controlled by the external origin.
- Final release requires the repository’s mandated automated security scans and independent Claude review.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Download, careers, content, and blog parity addendum (2026-08-01)

SECURITY REVIEW REQUEST

Change summary:

- Added dedicated reference-aligned `/download`, `/careers`, `/content`, and `/blog` public surfaces with captured hero, card, carousel, filter, search, CTA, and footer states.
- Reused the public marketing chrome with a fixed Supademo logo asset and bounded local UI state for the careers gallery, blog featured carousel, article filters, and article search.
- Added screenshot evidence and control inventories for the content and blog parity refreshes.

Files changed:

- apps/web/components/marketing-download.tsx
- apps/web/components/marketing-chrome.tsx
- apps/web/components/marketing-content-directory.tsx
- apps/web/components/marketing-blog.tsx
- apps/web/app/content/page.tsx
- apps/web/app/blog/page.tsx
- apps/web/app/globals.css
- tests/content-directory.test.mjs
- tests/blog-page.test.mjs
- browser-qa/supademo-local-2026-07-31/157-content-top.jpg
- browser-qa/supademo-local-2026-07-31/158-content-full.jpg
- browser-qa/supademo-local-2026-07-31/159-blog-top.jpg
- browser-qa/supademo-local-2026-07-31/160-blog-full.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- These are public, client-only presentation routes. Article copy, images, footer links, playbooks, and carousel data are static repository-owned values; no workspace records, credentials, uploads, analytics events, or authenticated API calls were added.
- The browser loads fixed public image assets from `supademo.com` and `cdn.sanity.io`; the assets are rendered as images with `referrerPolicy="no-referrer"` and are not treated as executable content.
- Blog search is local bounded text filtering with a 120-character input cap; it does not fetch or interpolate user input into URLs or markup.

Authorization model:

- `/download`, `/careers`, `/content`, and `/blog` are intentionally anonymous. Account, download, docs, and article CTAs navigate to fixed public or existing auth destinations; no privileged operation is performed in the new components.
- Article/playbook links use static same-origin paths. Blog filter/search and careers carousel state remain local and cannot grant or infer access to tenant data.

Threats considered:

- XSS and unsafe DOM sinks from article search and static copy; open redirects and URL interpolation; SSRF through image URLs; privacy leakage through referrers; unbounded carousel/filter state; accidental external download or account submission; and unsafe placeholder footer links.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `eval`, dynamic `Function`, or client fetch was introduced.
- Search input is bounded and only filters a static article list. Carousel indices and filter values are constrained to fixed arrays, with disabled bounds and accessible labels.
- All new image sources are fixed literals and use `referrerPolicy="no-referrer"`; no user-controlled URL reaches an image or navigation sink.
- Footer placeholders were replaced with concrete same-origin routes (cookie management uses `/privacy-policy#cookies`).
- Reduced-motion media queries remove authored carousel/card transitions.

Security tests added:

- `tests/content-directory.test.mjs` covers the dedicated route, fixed playbook links, remote preview asset, footer reuse, and unsafe-sink absence.
- `tests/blog-page.test.mjs` covers the featured carousel controls, bounded search affordance, category tabs, article content, reduced-motion CSS, and unsafe-sink absence.
- Browser QA verified `/content#list`, all content destinations, blog next-slide state, category filtering, bounded article search, and saved top/full screenshots.

Checks run and results:

- `npm run build` — passed after adding the blog route (TypeScript, API contract/types, and Next build).
- Targeted browser interaction checks — passed for content hash navigation, content destination inventory, blog carousel, category filtering, and article search.
- `git diff --check` — pending after this handoff update; run before merge.

Checks not run:

- Full `npm run verify` and `npm test` have not yet been rerun after the blog/content additions; run them before release.
- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this pass; repository CI should run them before release.
- Independent Claude security review remains unavailable and required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The public routes intentionally use static reference content and remote public imagery; asset availability and third-party CDN policy should be monitored.
- External Chrome/Microsoft/docs destinations and signup/auth flows were verified but not submitted or downloaded during QA.
- Some deep blog/content article routes still use the existing article fallback and need their own visual parity pass; this addendum covers the directory surfaces only.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## AI and AI Demo Agents parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added dedicated public marketing routes for `/ai` and `/ai/demo-agents` using Supademo-referenced hero layouts, navigation, static feature content, and same-origin CTAs.
- Added a bounded, client-only instant AI demo dialog on `/ai/demo-agents` with Escape dismissal and a signup preview link.
- Added reduced-motion CSS handling and refreshed browser evidence after aligning desktop geometry to the reference pages.

Files changed:

- `apps/web/app/ai/page.tsx`
- `apps/web/app/ai/demo-agents/page.tsx`
- `apps/web/components/marketing-ai.tsx`
- `apps/web/components/marketing-ai-agents.tsx`
- `apps/web/app/globals.css`
- `tests/ai.test.mjs`
- `tests/ai-demo-agents.test.mjs`
- `browser-qa/supademo-local-2026-07-31/151-ai-demo-agents-top.jpg`
- `browser-qa/supademo-local-2026-07-31/152-ai-demo-agents-full.jpg`
- `browser-qa/supademo-local-2026-07-31/manifest.json`
- `browser-qa/supademo-local-2026-07-31/button-actions.json`
- `browser-qa/supademo-local-2026-07-31/README.md`

Trust boundaries and sensitive data affected:

- Both routes are public and render repository-owned copy plus a remote Supademo hero image. No workspace records, uploads, analytics payloads, cookies, credentials, or privileged APIs are introduced.
- The dialog contains only static text and a fixed same-origin signup route. The external image is loaded with `referrerPolicy="no-referrer"` and is hidden on load failure.

Authorization model:

- `/ai` and `/ai/demo-agents` are intentionally anonymous marketing pages.
- CTAs navigate to existing authentication/request-demo boundaries; no account, workspace, or demo mutation is performed by these routes.
- The dialog's signup link is fixed to `/signup?source=ai-agent`; it does not accept user-provided redirect or destination parameters.

Threats considered:

- XSS/unsafe markup, open redirects, URL interpolation, external resource leakage, unbounded dialog state, keyboard dismissal races, clickjacking assumptions, and reduced-motion behavior.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, fetch, or dynamic URL construction was added.
- Static action destinations are same-origin literals. Dialog state is a boolean local state and Escape handling is removed on cleanup.
- External hero loading uses a fixed HTTPS origin and no referrer. The image has descriptive alt text and a non-throwing error fallback.
- The dialog exposes `role="dialog"`, `aria-modal`, a labelled heading, an explicit close button, and keyboard Escape dismissal. Reduced-motion CSS disables dialog transitions.

Security tests added:

- `tests/ai.test.mjs` verifies the route, bounded CTAs, reduced-motion CSS, and absence of unsafe sinks.
- `tests/ai-demo-agents.test.mjs` verifies the reference hero copy/asset, dialog semantics, Escape behavior wiring, fixed CTA, reduced-motion CSS, and unsafe-sink absence.
- Browser QA confirmed one `Try instant AI demo` button, dialog opening, labelled close control, and dialog dismissal; screenshots are stored under `browser-qa/supademo-local-2026-07-31/`.

Checks run and results:

- Targeted AI tests — passed.
- `npm run verify` — to be rerun after this parity patch.
- `npm test` — to be rerun after this parity patch.
- `git diff --check` — to be rerun after this parity patch.
- Impeccable detector — previously run on the marketing surfaces; rerun on the final AI files before merge.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not available in this environment; CI should run them before release.
- An independent Claude security review was not available and remains required by `AGENTS.md` before merge or release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The hero asset is served from `supademo.com`; availability, content changes, and third-party privacy implications require product/legal approval or migration to an approved first-party asset.
- The pages remain static presentation surfaces; wiring AI-agent execution, lead capture, analytics, or authenticated workspace data requires a separate threat model and tenant-isolation tests.
- Visual parity is verified at the captured desktop viewport; additional responsive and localization review remains required.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Public marketing parity, motion, and MCP article addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Refined the shared public marketing chrome, homepage hero animation, feature embed fallback, use-case imagery, and pricing controls against fresh Supademo browser captures.
- Added a route-specific MCP article header for `/blog/product-update-mcp-server` so the public article uses the reference hero composition, metadata order, author row, responsive sizing, and stable layout geometry.
- Added reduced-motion behavior for the authored hero transition and preserved bounded local state for marketing controls.

Files changed:

- apps/web/components/marketing-chrome.tsx
- apps/web/components/marketing-home.tsx
- apps/web/components/marketing-features.tsx
- apps/web/components/marketing-use-cases.tsx
- apps/web/components/marketing-pricing.tsx
- apps/web/components/marketing-content-page.tsx
- apps/web/app/globals.css
- tests/features.test.mjs
- tests/marketing-reference.test.mjs
- tests/pricing.test.mjs
- docs/reviews/public-marketing-home-security-handoff.md

Trust boundaries and sensitive data affected:

- Marketing routes remain public and use static repository content plus two explicitly referenced public assets: the Supademo hero image and the Sanity-hosted MCP article hero. The features preview embeds a public Supademo player in a sandboxed iframe.
- The MCP image uses `referrerPolicy="no-referrer"` and hides on load failure; article copy and local controls do not read workspace data, cookies, uploads, or analytics.

Authorization model:

- No protected operation or authorization decision was added. Public CTAs hand off to existing auth/request-demo boundaries. Pricing, tabs, steppers, article section controls, and hero motion are local UI state only.

Threats considered:

- Third-party asset or iframe failure, unsafe DOM sinks, external navigation, secret/referrer leakage, unbounded creator-seat state, XSS through article content, and reduced-motion/accessibility regressions.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `eval`, dynamic `Function`, or user-controlled URL construction was added.
- The external player is sandboxed to `allow-scripts allow-same-origin`, uses `referrerPolicy="no-referrer"`, lazy loading, and an in-page placeholder fallback.
- Public image references use explicit `referrerPolicy="no-referrer"`; failed assets are hidden without exposing response details.
- Creator-seat controls remain clamped to bounded values; motion is disabled under `prefers-reduced-motion`.

Security tests added:

- `tests/marketing-reference.test.mjs` covers the MCP asset reference, no-referrer policy, shared route surface, and unsafe-sink absence.
- `tests/features.test.mjs` covers the sandboxed embed source and fallback behavior.
- `tests/pricing.test.mjs` covers bounded billing/creator controls and enterprise styling.
- Browser QA reloaded the local MCP article and compared hero, title, author, and layout geometry with the live reference. Updated local evidence is stored in `browser-qa/supademo-local-2026-07-31/147-mcp-article-top.png` and `148-mcp-article-full.png`.

Checks run and results:

- Targeted marketing/auth tests — passed: 12 passed, 0 failed.
- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- `npm test` — passed: 417 passed, 1 skipped, 0 failed (418 total); includes the production web build.
- `git diff --check` — passed before this handoff append; rerun after the final documentation/evidence update.
- Impeccable detector — passed with no findings on the changed marketing UI files.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not available in this environment; repository CI should run them before release.
- Independent Claude security review was not available and remains required by `AGENTS.md` before merge or release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- External marketing images and the public Supademo iframe remain third-party runtime dependencies; their availability and content can change independently of this repository.
- Long-tail public article bodies and backend-backed workspace data remain synthetic or approximate in the local implementation; exact pixel parity is not proven for every dynamic route.
- The Sanity CDN image is public reference content only; do not reuse this pattern for private workspace assets without short-lived, object-scoped authorization.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Public marketing parity and motion addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Refined the shared public header, announcement strip, responsive menu, pricing cards, and route-specific responsive geometry to match current Supademo reference captures.
- Matched the homepage hero frame inset and height, preserved the single authored hero-step transition, and kept `prefers-reduced-motion` behavior.
- Matched the pricing card structure with plan labels, bounded creator controls, annual-billing state, enterprise outline CTA, and demo-type lists.
- Matched the use-case hero typography/art placement and added a no-referrer policy to the static reference image.
- Replaced the feature preview with the current public Supademo embed, added an explicit sandbox, no-referrer policy, deterministic height, and a repository-owned fallback shown only when the embed fails.
- Added regression assertions for the remote embed boundary, fallback behavior, and pricing visual structure.

Files changed:

- apps/web/app/globals.css
- apps/web/components/marketing-chrome.tsx
- apps/web/components/marketing-home.tsx
- apps/web/components/marketing-features.tsx
- apps/web/components/marketing-use-cases.tsx
- apps/web/components/marketing-pricing.tsx
- tests/features.test.mjs
- tests/pricing.test.mjs

Trust boundaries and sensitive data affected:

- The marketing routes remain public and render repository-owned copy plus three public Supademo-hosted assets: the homepage hero image, the use-case hero image, and the feature preview iframe.
- The feature iframe is a cross-origin remote document at `https://app.supademo.com/embed/cmewzomb200ci0m0jgnfi4xgm`. No application API calls or user data are passed to it by this code.
- Static image requests use `referrerPolicy="no-referrer"`; the iframe uses the same policy and `sandbox="allow-scripts allow-same-origin"` without forms, popups, downloads, top navigation, or other additional permissions.
- Pricing, tabs, buttons, and motion state are local bounded UI state. No tenant data, upload, analytics, or authenticated API boundary was added.

Authorization model:

- Public marketing routes are intentionally anonymous. CTAs navigate to the existing signup/auth boundaries; they do not authorize workspace actions.
- Remote preview content is display-only in the local page. The iframe cannot access the parent origin under the browser same-origin policy, and no privileged `postMessage` bridge was added.
- Account creation/login continues to use the existing local development provider and CSRF/session controls; this UI pass did not weaken those controls.

Threats considered:

- Remote asset and iframe trust expansion, third-party cookie/referrer leakage, iframe escape, unsafe navigation, XSS/unsafe DOM sinks, open redirects, state bounds, keyboard access, and reduced-motion regressions.
- Accidental pricing actions, unbounded creator counts, stale external embeds, and fallback/error paths.

Security controls implemented:

- The iframe is sandboxed to scripts and same-origin only, uses no-referrer, and is rendered at a fixed bounded size.
- The remote feature preview has an explicit load/error state; a static local placeholder is shown if the remote document fails instead of rendering arbitrary response content.
- External images are decorative/reference-only and use no-referrer plus lazy loading; their error fallback is local CSS/art.
- Pricing creator controls clamp values to 1–10 and remain native buttons with accessible labels; annual billing is a bounded boolean switch.
- No `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `eval`, `new Function`, dynamic URL input, or client-side data fetch was added.
- Motion is limited to the authored demo-step transition and remains disabled under `prefers-reduced-motion`.

Security tests added:

- `tests/features.test.mjs` asserts the exact embed source, sandbox permissions, error handler, fallback surface, keyboard tabs, and unsafe-sink absence.
- `tests/pricing.test.mjs` asserts bounded billing/creator controls, plan labels, enterprise CTA styling, and unsafe-sink absence.
- Existing auth/API, tenant-isolation, XSS, SSRF, upload, and CSRF suites remain unchanged and passed.

Checks run and results:

- `node --test tests/home-sections.test.mjs tests/pricing.test.mjs tests/features.test.mjs tests/use-cases.test.mjs tests/marketing-reference.test.mjs tests/auth-screen.test.mjs` — passed: 12/12.
- `npm run verify` — passed (format, ESLint, workspace boundaries, and TypeScript checks).
- `npm test` — passed: 417 passed, 1 skipped, 0 failed; production web build succeeded.
- `git diff --check` — passed.
- Impeccable detector on the changed public UI targets — returned `[]`.
- Browser smoke — signup and login both redirected to `/home`; pricing switch/card state was present; feature iframe loaded at 545px with the fallback hidden; homepage/use-case/features/pricing screenshots were compared against the live reference at the same browser viewport.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not available in this environment; repository CI must run them before release.
- An independent Claude security review was not available and remains mandatory under `AGENTS.md` before merge or release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Visual content inside the remote iframe and public images is controlled by Supademo and can change, disappear, or expose ordinary browser metadata according to the browser's third-party-cookie/network policy; local parity therefore depends on external availability.
- The iframe's `allow-scripts allow-same-origin` is required by the public embed and is an explicit external trust boundary. It must not be expanded or reused for same-origin untrusted HTML without a separate isolation review.
- The public crawl covered discoverable routes and the key marketing/workspace surfaces, but dynamic authenticated states and every long-tail generic content route have not been proven pixel-identical to the live site.
- The local account provider remains development-only and is not production identity infrastructure.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Public route crawl and deep-route fallback addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added route-level fallbacks for deep `/use-cases/*`, `/tools/*`, and `/product-demo/*` paths that previously returned framework 404 pages.
- Added a route-aware static content/legal/AI/careers/security reference surface for the remaining public Supademo paths.
- Completed a non-destructive browser crawl of the local union of app and public reference routes, captured full-page evidence, exercised bounded tabs/filters/section navigation/carousels, and recorded each control action.

Files changed:

- apps/web/app/use-cases/[slug]/page.tsx
- apps/web/app/tools/[slug]/page.tsx
- apps/web/app/product-demo/[slug]/page.tsx
- apps/web/components/marketing-content-page.tsx
- apps/web/components/marketing-reference-page.tsx
- apps/web/app/globals.css
- tests/marketing-reference.test.mjs
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md
- browser-qa/supademo-local-2026-07-31/055-_.jpg through 146-_.jpg

Trust boundaries and sensitive data affected:

- These are public, static reference surfaces. No authenticated workspace records, uploads, cookies, analytics events, secrets, or external API responses are read or written by the new pages.
- Browser evidence was saved locally under `browser-qa/`; screenshots may contain only synthetic reference copy and must not be treated as customer data.
- Fixed external links on the security page target the Supademo Trust Center and security mailbox; no user-controlled URL is accepted.

Authorization model:

- Public routes intentionally remain anonymous. The dynamic fallbacks only render static text/art and fixed same-origin or explicitly fixed external links; they do not authorize, fetch, publish, share, export, or mutate workspace resources.
- Authenticated application routes and API authorization are unchanged. Any future replacement of the synthetic reference content with tenant data must add server-side identity, tenant scope, and permission checks.

Threats considered:

- XSS/unsafe HTML, open redirects, SSRF, secret exposure, query/route injection, arbitrary code execution, and accidental exposure of authenticated data through public fallback pages.
- Deep-route 404s masking an incorrect route boundary, framework-injected development controls in the crawl inventory, and destructive side effects from blindly activating CTAs, uploads, upgrades, publishing, or account controls.

Security controls implemented:

- React text rendering with bounded, repository-owned maps; no `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `eval`, `Function`, fetch, or dynamic external script was added.
- Dynamic route parameters are used only to select the static reference copy passed to the shared renderer; no parameter is interpolated into an outbound request or filesystem path.
- External security links are fixed literals. Public CTA links remain existing routes and do not grant access by themselves.
- Browser QA excluded the injected “Open Next.js Dev Tools” control from the inventory and left ambiguous/state-changing controls untouched. Safe tabs, filters, article/legal section buttons, disclosures, and the careers carousel were activated one by one.
- Motion and focus behavior continue to use the existing reduced-motion and semantic-control styles.

Security tests added:

- `tests/marketing-reference.test.mjs` now verifies the content surface and all three deep-route fallback modules, including unsafe-sink absence.
- Browser QA manifest now records 135 local route/query surfaces and 428 visible controls, with 279 bounded activations, 134 icon-only/ambiguous controls left untouched, and 15 state-changing controls intentionally not submitted; `button-actions.json` records each activation and reason.

Checks run and results:

- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- `node --test tests/marketing-reference.test.mjs` — passed.
- Impeccable detector on the changed marketing content/reference modules — no findings.
- Browser QA — all 117 captured local routes returned a rendered page after the deep-route fallback patch; the final smoke pass found zero 404/not-found markers. Full-page screenshots and control evidence are in `browser-qa/supademo-local-2026-07-31/`.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, dependency audits, and an independent Claude security review were not available in this environment; repository policy requires those checks/review before merge or release.
- `npm test` — passed: 417 passed, 1 skipped, 0 failed (418 tests total; includes the production build).
- `git diff --check` — passed.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Deep feature, use-case, tool, and customer routes use a shared static reference fallback rather than proprietary Supademo media or server-backed data; visual parity is therefore approximate on those pages.
- The `/security` reference points to the external Trust Center; the local page does not mirror that external site's content or security controls.
- Browser full-page stitching can repeat the shared public chrome on very long pages; individual evidence files retain the complete captured viewport sequence, but pixel-perfect comparison should use the dedicated reference screenshots as well.
- The non-destructive crawl intentionally did not submit authentication, uploads, exports, upgrades, publishing, or other ambiguous state-changing controls. Those flows require dedicated test accounts and authorization review.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Academy reference surface parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/academy` route modeled on the captured Supademo Academy workspace.
- Added the Academy shell, sidebar course navigation, dark lesson hero, outcome cards, bounded lesson carousel, guide cards, and Start the Course CTA.
- Added browser evidence for the default Academy surface and exercised every local navigation, carousel, guide, and start control.

Files changed:

- apps/web/app/academy/page.tsx
- apps/web/components/marketing-academy.tsx
- apps/web/app/globals.css
- tests/academy.test.mjs
- browser-qa/supademo-local-2026-07-31/051-academy-full.jpg
- browser-qa/supademo-local-2026-07-31/052-academy-controls.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- The page is public and client-only. Lesson titles, descriptions, art, and course labels are static repository-owned content; no customer records, cookies, uploads, analytics, or network calls are introduced.
- Sidebar selection and carousel state are bounded local indices/identifiers.

Authorization model:

- `/academy` is intentionally anonymous. Login/signup and playbook links use fixed routes; no workspace data or privileged operation is exposed.
- Deeper `/academy/*` paths continue through the generic public reference surface until their dedicated parity pass.

Threats considered:

- XSS/unsafe markup, open redirects, unbounded carousel indices, accidental external calls, and ambiguous course actions.
- Keyboard navigation, disabled carousel bounds, active navigation state, and reduced-motion behavior.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, fetch, or external script was added.
- Lesson carousel indices are clamped to the static lesson list. Sidebar, guide, and CTA controls use static values and fixed routes.
- Native buttons expose pressed/disabled state and card motion has a reduced-motion fallback.

Security tests added:

- `tests/academy.test.mjs` verifies bounded lesson/guide controls, disabled carousel bounds, fixed routes, reduced-motion CSS, and unsafe-sink absence.
- Browser QA clicked all eight sidebar controls, Previous, Next, all three guides, and Start the Course; screenshots are stored in `browser-qa/supademo-local-2026-07-31/`.

Checks run and results:

- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- Targeted Academy test — passed.
- Browser QA — passed for every local Academy control and screenshot capture.
- Impeccable detector — pending for the new Academy TSX targets; run before merge.
- Full `npm test` — pending after this Academy implementation; run before merge.
- `git diff --check` — pending after this final handoff/evidence formatting edit; run before merge.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this UI-only pass; repository CI should run them before release.
- Independent Claude security review remains unavailable and required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Lesson content and progress are static reference content; real Academy courses, authentication, completion tracking, and analytics need a separate security review.
- The external Supademo Academy source may evolve independently of this local parity implementation.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Accessibility statement reference surface parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/accessibility` route modeled on Supademo's accessibility statement and VPAT page.
- Added the intro, commitment/standards/testing/status/VPAT/feedback/alternative-format sections, sticky “On this page” navigation, and shared footer.
- Added browser evidence for the complete statement and exercised all seven section navigation controls.

Files changed:

- apps/web/app/accessibility/page.tsx
- apps/web/components/marketing-accessibility.tsx
- apps/web/app/globals.css
- tests/accessibility-page.test.mjs
- browser-qa/supademo-local-2026-07-31/049-accessibility-full.jpg
- browser-qa/supademo-local-2026-07-31/050-accessibility-formats.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- The page is public and client-only. Policy copy, standards, status, and table values are static repository-owned content; no customer records, cookies, uploads, analytics, or network calls are introduced.
- Section navigation stores only one of seven static identifiers and scrolls to fixed DOM ids.

Authorization model:

- `/accessibility` is intentionally anonymous. VPAT, help, and feedback links use fixed public or mailto destinations and expose no workspace data or privileged operation.

Threats considered:

- Unsafe markup, open redirects, untrusted section identifiers, unexpected DOM targets, and privacy leakage through contact paths.
- Keyboard navigation, focus-visible states, responsive table overflow, and reduced-motion behavior.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, fetch, or external script was added.
- Section state is constrained to a static allowlist, and `scrollIntoView` targets fixed IDs. All external links are fixed literals.
- Native buttons, headings, lists, table semantics, mailto labels, and reduced-motion fallback support accessible use.

Security tests added:

- `tests/accessibility-page.test.mjs` verifies bounded section navigation, fixed contacts/VPAT links, reduced-motion CSS, and unsafe-sink absence.
- Browser QA clicked all seven section controls and captured complete and final-section screenshots.

Checks run and results:

- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- Targeted accessibility test — passed.
- Browser QA — passed for all section controls and screenshot capture.
- Impeccable detector — pending for the new accessibility TSX targets; run before merge.
- Full `npm test` — pending after this accessibility implementation; run before merge.
- `git diff --check` — pending after this final handoff/evidence formatting edit; run before merge.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this UI-only pass; repository CI should run them before release.
- Independent Claude security review remains unavailable and required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Accessibility status, dates, standards, and VPAT language are reference content and require accessibility/legal owner review before publication.
- The VPAT detail route remains a generic public reference surface and needs its own parity pass.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Tutorials directory reference surface parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/tutorials` directory modeled on the captured Supademo tutorial index.
- Added the search hero, bounded tool-filter chips, tutorial cards, empty state, CTA, and shared public footer.
- Added browser evidence for the complete directory and a Figma search state; all twenty tool filters were exercised.

Files changed:

- apps/web/app/tutorials/page.tsx
- apps/web/components/marketing-tutorials.tsx
- apps/web/app/globals.css
- tests/tutorials.test.mjs
- browser-qa/supademo-local-2026-07-31/046-tutorials-full.jpg
- browser-qa/supademo-local-2026-07-31/047-tutorials-figma-search.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- The page is public and client-only. Tutorial titles, descriptions, tool names, and card art are static repository-owned reference content; no customer records, cookies, uploads, analytics, or network calls are introduced.
- Search and tool selection are bounded local UI state. Search text is capped at 80 characters and is used only for in-memory filtering.

Authorization model:

- `/tutorials` is intentionally anonymous. Tutorial links route to public same-origin paths; the CTA routes to the existing signup boundary and no workspace data is read or mutated.
- Deeper `/tutorials/*` paths continue through the generic public reference surface until their dedicated parity pass.

Threats considered:

- Reflected XSS, unsafe markup, open redirects, query injection, unbounded search input, accidental external calls, and empty-result confusion.
- Keyboard tab semantics, native search labeling, card link safety, and reduced-motion behavior.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, fetch, or external script was added.
- Search input is trimmed and capped to 80 characters; filter values are selected from a static allowlist and card paths derive from static tool labels only.
- Native tabs, labels, `aria-live`, and a `role="status"` empty state provide accessible feedback. Card hover motion has a reduced-motion fallback.

Security tests added:

- `tests/tutorials.test.mjs` verifies the route, bounded search/filter controls, safe tutorial links, reduced-motion CSS, and unsafe-sink absence.
- Browser QA activated every tool filter, validated the Figma search result, and captured complete and filtered screenshots.

Checks run and results:

- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- Targeted tutorials test — passed.
- Browser QA — passed for all twenty filters, search filtering, and screenshot capture.
- Impeccable detector — run on the new tutorials TSX targets; no findings.
- Full `npm test` — pending after this tutorials implementation; run before merge.
- `git diff --check` — pending after this final handoff/evidence formatting edit; run before merge.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this UI-only pass; repository CI should run them before release.
- Independent Claude security review remains unavailable and required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Tutorial titles, tool names, and descriptions are synthetic reference content; production tutorial ingestion and search indexing need a separate data/privacy review.
- Deeper tutorial detail pages still need their own functional parity pass.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Help center reference surface parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/help` route modeled on the captured Supademo help center launcher.
- Added the support-option cards, interactive product-tour preview, direct support contact, and shared public footer.
- Added browser evidence for the complete help surface.

Files changed:

- apps/web/app/help/page.tsx
- apps/web/components/marketing-help.tsx
- apps/web/app/globals.css
- tests/help.test.mjs
- browser-qa/supademo-local-2026-07-31/048-help-full.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- The page is public and client-only. Support copy and preview art are static repository-owned content; no customer records, cookies, uploads, analytics, or network calls are introduced.
- Support links and mailto contact are fixed destinations and do not interpolate user input.

Authorization model:

- `/help` is intentionally anonymous. The docs, feedback, status, changelog, tour, and support email links are public support destinations; no workspace data or privileged operation is exposed.

Threats considered:

- Open redirects, unsafe markup, accidental external requests, misleading destination changes, and privacy leakage through contact links.
- Keyboard focus, link labels, responsive layout, and reduced-motion behavior.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, fetch, or external script was added.
- Every support and tour destination is a fixed literal; direct support uses a fixed mailto address.
- Native links are labeled with their action, and card motion has a reduced-motion fallback.

Security tests added:

- `tests/help.test.mjs` verifies fixed support destinations, the tour CTA, reduced-motion CSS, and unsafe-sink absence.
- Browser QA captured the complete help page and verified support links are present in the rendered DOM.

Checks run and results:

- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- Targeted help test — passed after correcting the apostrophe assertion to match JSX entity encoding.
- Browser QA — passed for support-link inventory and screenshot capture.
- Impeccable detector — pending for the new help TSX targets; run before merge.
- Full `npm test` — pending after this help implementation; run before merge.
- `git diff --check` — pending after this final handoff/evidence formatting edit; run before merge.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this UI-only pass; repository CI should run them before release.
- Independent Claude security review remains unavailable and required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The docs, feedback, status, and tour links are external surfaces; their availability and security are outside this local implementation.
- Support is represented by a fixed email link; real ticket submission, rate limits, and abuse controls remain out of scope.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Enterprise landing page reference surface parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/enterprise` route modeled on the captured Supademo enterprise page.
- Added the enterprise hero, capability preview carousel, trust/awards band, customer logo cloud, four procurement pillars, security/support cards, CTA, FAQ disclosures, and shared public footer.
- Added browser evidence for the default hero and FAQ state, and exercised capability and pillar controls.

Files changed:

- apps/web/app/enterprise/page.tsx
- apps/web/components/marketing-enterprise.tsx
- apps/web/app/[...slug]/page.tsx
- apps/web/app/globals.css
- tests/enterprise.test.mjs
- browser-qa/supademo-local-2026-07-31/044-enterprise-full.jpg
- browser-qa/supademo-local-2026-07-31/045-enterprise-faq.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- The page is public and client-only. Enterprise copy, awards, customer names, dashboard art, and FAQ text are static repository-owned reference content; no customer records, cookies, uploads, analytics, or network calls are introduced.
- Capability, pillar, carousel, and FAQ state is bounded local UI state. The only external destination is the fixed Trust Center link; CTAs use fixed same-origin routes.

Authorization model:

- `/enterprise` is intentionally anonymous. Talk-to-sales links route to the existing public request flow, and no workspace data or administrative operation is exposed by the page.
- The route is reserved from the generic fallback so a missing enterprise route cannot silently expose a different page category.

Threats considered:

- XSS/unsafe markup, open redirects, URL interpolation, unbounded state, accidental external calls, and disclosure/carousel state races.
- Keyboard button/tab semantics, FAQ disclosure behavior, reduced-motion behavior, and misleading commercial/security claims.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, fetch, or external script was added.
- Capability and pillar state is constrained to static array bounds; native buttons, tabs, `aria-live`, and `details` disclosures provide accessible state.
- All CTA destinations are fixed literals. Customer names, award labels, metrics, and dashboard values are synthetic reference content and are not read from user input.
- Motion is limited to card hover feedback with a reduced-motion fallback.

Security tests added:

- `tests/enterprise.test.mjs` verifies the route, bounded capability/pillar controls, fixed destinations, FAQ markup, reduced-motion CSS, and unsafe-sink absence.
- Browser QA exercised AI Demo Agents, Previous, Next, all four procurement pillars, and a FAQ disclosure; screenshots are stored in `browser-qa/supademo-local-2026-07-31/`.

Checks run and results:

- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- Targeted enterprise test — passed.
- Browser QA — passed for capability selection, carousel controls, pillar tabs, FAQ disclosure, and screenshot capture.
- Impeccable detector — run on the new enterprise TSX targets; no findings.
- Full `npm test` — passed: 411 passed, 1 skipped, 0 failed (412 tests total); includes the production web build and `/enterprise`.
- `git diff --check` — passed after the enterprise implementation and evidence updates.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this UI-only pass; repository CI should run them before release.
- Independent Claude security review remains unavailable and required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Enterprise customer names, awards, metrics, security claims, and SLA language are synthetic reference content and require product/legal approval before being treated as verified claims.
- The Trust Center is an external link; the local app does not fetch or embed it.
- Real enterprise workspaces, SSO, audit logs, data residency, and lead submission remain out of scope and require a separate server-side security review.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Product demo request page parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/product-demo` route matching the split Supademo “See Supademo in action” form and proof panel.
- Added bounded name/email/goal inputs, generic validation feedback, a local success/recovery state, fixed instant-demo signup navigation, responsive layout, and reduced-motion styling.
- Added browser evidence for the default form and local success state.

Files changed:

- apps/web/app/product-demo/page.tsx
- apps/web/components/marketing-product-demo.tsx
- apps/web/app/[...slug]/page.tsx
- apps/web/app/globals.css
- tests/product-demo.test.mjs
- browser-qa/supademo-local-2026-07-31/042-product-demo-full.jpg
- browser-qa/supademo-local-2026-07-31/043-product-demo-success.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- The page is public and client-only. The form holds name/email/goal only in ephemeral React state; it does not persist or transmit the values.
- Proof copy and metrics are static repository-owned reference content. The instant-demo CTA is a fixed same-origin path with a bounded source query.

Authorization model:

- `/product-demo` is intentionally anonymous. The request form displays a local confirmation only; no lead record, account, workspace, or entitlement is created by this page.
- The route is reserved from the generic fallback; any future lead-submission endpoint must enforce authentication policy, spam controls, privacy consent, and rate limits server-side.

Threats considered:

- XSS through form fields, oversized input, malformed email, data leakage, accidental submission, open redirects, and sensitive data persistence.
- Error/status semantics, keyboard form operation, recovery from success state, responsive layout, and reduced-motion behavior.

Security controls implemented:

- Text input is capped at 120 characters for names/goals and 254 characters for email; email format and goal membership are checked against a static allowlist.
- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, fetch, storage, logging, or external script was added.
- The form uses native labels, select, submit button, `role="alert"`, and `role="status"`; the success state can be safely reopened for editing.
- The skip link is a fixed `/signup?source=instant-ai-demo` destination; no user value is interpolated into it.

Security tests added:

- `tests/product-demo.test.mjs` verifies input bounds/validation structure, status/error semantics, fixed navigation, reduced-motion CSS, and unsafe-sink absence.
- Browser QA submitted an invalid empty form, validated a complete local request, displayed the success state, returned with Edit request, and captured both states.

Checks run and results:

- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- Targeted product-demo test — passed.
- Browser QA — passed for invalid validation, valid local success, recovery, and screenshot capture.
- Impeccable detector — run on the new product-demo TSX targets; no findings.
- Full `npm test` — passed: 411 passed, 1 skipped, 0 failed (412 tests total); includes the production web build and `/product-demo`.
- `git diff --check` — pending after this final handoff/evidence formatting edit; run before merge.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this UI-only pass; repository CI should run them before release.
- Independent Claude security review remains unavailable and required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The form intentionally stops at a local confirmation because no approved lead destination was provided; production submission requires a separate server/API security review.
- Customer metrics and proof copy are synthetic reference content and require product/legal approval before being treated as verified claims.
- The deeper `/product-demo/live-training` page remains a generic reference route and needs its own parity pass.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Integrations directory reference surface parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/integrations` route modeled on the captured Supademo integrations directory.
- Added the pale two-column hero, CSS-authored workflow preview, category disclosure, seven bounded radio filters, integration-card groups, reset control, CTA, and shared public footer.
- Added browser evidence for the complete directory and a Sales & CRM filtered state.

Files changed:

- apps/web/app/integrations/page.tsx
- apps/web/components/marketing-integrations.tsx
- apps/web/app/[...slug]/page.tsx
- apps/web/app/globals.css
- tests/integrations.test.mjs
- browser-qa/supademo-local-2026-07-31/038-integrations-full.jpg
- browser-qa/supademo-local-2026-07-31/039-integrations-sales-crm.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- The directory is public and static. It introduces no uploads, customer records, cookies, analytics, or network calls.
- Category state is local React state. Integration names, descriptions, and slugs are repository-owned constants; no browser input reaches a URL, parser, or DOM sink.

Authorization model:

- `/integrations` is intentionally anonymous. CTAs navigate to existing public/auth boundaries; card links remain same-origin reference routes and do not create, mutate, publish, or grant access to workspace data.
- The route is reserved from the generic fallback so a missing integration path cannot silently expose another page category.

Threats considered:

- XSS/unsafe markup, open redirects, URL interpolation, query injection, unbounded filter state, accidental third-party calls, and stale UI state.
- Disclosure/radio keyboard semantics, filter reset behavior, empty or filtered results, and reduced-motion behavior.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, fetch, or external script was added.
- Category selection is limited to the static group list; filtering only selects static integration records.
- Card links interpolate only static slugs into same-origin paths. The reset action restores the complete static list without a network or persistent write.
- Native radio controls, `aria-expanded`, `aria-live`, explicit labels, and a reduced-motion fallback are used for the interactive surface.

Security tests added:

- `tests/integrations.test.mjs` verifies the route, bounded category disclosure/radio filter, safe static card links, reduced-motion CSS, and unsafe-sink absence.
- Browser QA toggled Categories, selected Sales & CRM, verified the result count dropped to eight cards, cleared the filter, and captured complete/filtered screenshots.

Checks run and results:

- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- Targeted integrations test — passed.
- Browser QA — passed for disclosure close/reopen, Sales & CRM filter, reset, and screenshot capture.
- Impeccable detector — run on the new integrations TSX targets; no findings.
- `npm test` — passed: 411 passed, 1 skipped, 0 failed (412 tests total); includes the production web build and the `/integrations` route.
- `git diff --check` — pending after this final handoff/evidence formatting edit; run before merge.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this UI-only pass; repository CI should run them before release.
- Independent Claude security review remains unavailable and required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Integration cards are static reference content and the deeper `/integrations/*` pages still need their own functional parity pass before they can be considered complete.
- Card links intentionally remain same-origin reference routes; wiring real OAuth, embeds, webhooks, or provider APIs requires a separate authorization, SSRF, secret-handling, replay, and tenant-isolation review.
- The full-page screenshot utility repeats the public chrome while stitching this long page; the filtered screenshot and DOM state evidence remain reliable for the tested controls.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Use-cases reference surface parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/use-cases` route modeled on the captured Supademo use-case library.
- Added the left-aligned team-use-case hero, seven bounded team tabs, featured use-case panel, dark six-card grid, feature carousel, trust/testimonial toggle, CTA, and shared public footer.
- Added reduced-motion-safe state transitions and browser evidence for the default, carousel-next, and testimonials-hidden states.

Files changed:

- apps/web/app/use-cases/page.tsx
- apps/web/components/marketing-use-cases.tsx
- apps/web/app/[...slug]/page.tsx
- apps/web/app/globals.css
- tests/use-cases.test.mjs
- browser-qa/supademo-local-2026-07-31/033-use-cases-full.jpg
- browser-qa/supademo-local-2026-07-31/034-use-cases-features-next.jpg
- browser-qa/supademo-local-2026-07-31/035-use-cases-featured-off.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- The route is public and client-only. All copy, cards, links, and preview art are static repository-owned content; no customer records, cookies, uploads, analytics, or network requests are introduced.
- Team-tab links are fixed same-origin paths. No browser-provided value reaches a URL, parser, DOM sink, or external service.

Authorization model:

- `/use-cases` is intentionally anonymous. Its CTA and story links only navigate to existing public/auth boundaries and do not create accounts, mutate entitlements, or access workspace data.
- The route is reserved from the generic fallback; no authenticated workspace route is exposed by this change.

Threats considered:

- XSS or dynamic-code execution through use-case copy, carousel state, and authored preview art.
- Open redirects, URL interpolation, query injection, accidental third-party calls, and state races.
- Keyboard operation, tab semantics, carousel boundaries, toggle state, and reduced-motion behavior.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, fetch, or third-party script was added.
- Team tabs and carousel indices are bounded static-array state. Previous/Next controls clamp at both ends and expose disabled states; Featured uses `aria-pressed`.
- Tab panels and stateful regions expose `aria-selected`, `aria-controls`, `aria-live`, and explicit labels.
- Preview art is CSS-authored and inert; all navigation destinations are fixed literals.
- Motion has a `prefers-reduced-motion` fallback.

Security tests added:

- `tests/use-cases.test.mjs` verifies the route, bounded team tabs, carousel controls, testimonial toggle, reduced-motion CSS, and unsafe-sink absence.
- Browser QA activated all seven team tabs, Next, Previous, and Featured from fresh renders; screenshots are stored in `browser-qa/supademo-local-2026-07-31/`.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- Targeted use-cases test — passed.
- Impeccable detector — run on the new use-case TSX targets; no findings.
- `git diff --check` — pending after this final handoff edit; run before merge.

Checks not run:

- `npm test` — passed: 407 passed, 1 skipped, 0 failed; includes the production web build and the `/use-cases` route.
- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this UI-only pass; repository CI should run them before release.
- Independent Claude security review remains unavailable and required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Preview art, testimonial copy, trust badges, and outcome wording are synthetic reference content; they must not be presented as verified commercial claims without product/legal approval.
- The full-page screenshot utility repeats the public chrome while stitching this long page; the viewport/state captures remain reliable visual evidence.
- Wiring real use-case content or customer analytics requires tenant authorization, privacy review, and cross-tenant negative tests.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Tools directory reference surface parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/tools` route modeled on the captured Supademo free-tools directory.
- Added the two-column hero/dashboard treatment, category disclosure, bounded category checkboxes, 29 static tool cards, fixed same-origin “Try it live” links, and shared public footer.
- Added browser evidence for the complete directory and the AI-filtered state.

Files changed:

- apps/web/app/tools/page.tsx
- apps/web/components/marketing-tools.tsx
- apps/web/app/[...slug]/page.tsx
- apps/web/app/globals.css
- tests/tools.test.mjs
- browser-qa/supademo-local-2026-07-31/036-tools-full.jpg
- browser-qa/supademo-local-2026-07-31/037-tools-ai-filter.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- The directory is public and static. It introduces no uploads, file processing, customer records, cookies, analytics, or network calls.
- Category selections are local checkbox state. Tool slugs are repository-owned constants and are the only values interpolated into same-origin paths.

Authorization model:

- `/tools` is intentionally anonymous. Tool links only navigate to public reference routes; no account, subscription, entitlement, or workspace operation occurs on this page.
- The route is reserved from the generic fallback so a missing route cannot silently expose a different page category.

Threats considered:

- XSS/unsafe markup, URL interpolation, open redirects, query injection, unbounded filter state, and third-party calls.
- Checkbox/disclosure keyboard semantics, empty filter results, and reduced-motion behavior.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, fetch, or external script was added.
- Category state is constrained to the static category list, and filtering only selects from the static tool array.
- Tool links interpolate only static slugs; no query or path input comes from the browser.
- The disclosure exposes `aria-expanded`; the filter result region uses `aria-live`; card hover motion has a reduced-motion fallback.

Security tests added:

- `tests/tools.test.mjs` verifies the route, bounded category filter/disclosure, safe static tool links, reduced-motion CSS, and unsafe-sink absence.
- Browser QA toggled Category, selected AI, verified the result count dropped to two cards, and captured complete/filtered screenshots.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- Targeted tools test — passed.
- Impeccable detector — run on the new tools TSX targets; no findings.
- Full `npm test` — passed: 411 passed, 1 skipped, 0 failed (412 tests total); includes the production web build and `/tools`.
- `git diff --check` — pending after this final handoff/evidence formatting edit; run before merge.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this UI-only pass; repository CI should run them before release.
- Independent Claude security review remains unavailable and required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The directory intentionally implements the captured popular-tool catalog; each deeper `/tools/*` workflow still needs its own functional parity pass before it can be considered complete.
- Tool descriptions and calculator copy are static reference content and must be validated before any production calculation or upload workflow is wired in.
- The full-page screenshot utility repeats the public chrome while stitching this long page; the filtered viewport capture is clean state evidence.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Customers reference surface parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/customers` route modeled on the captured customer-story library.
- Added bounded company-size/use-case filters, static story cards, a “show more” control, and a dark aggregate-stats band.
- Browser QA captured the clean route, filtered state, and exercised the pagination control.

Files changed:

- apps/web/app/customers/page.tsx
- apps/web/components/marketing-customers.tsx
- apps/web/app/globals.css
- tests/customers.test.mjs
- browser-qa/supademo-local-2026-07-31/031-customers-full.jpg
- browser-qa/supademo-local-2026-07-31/032-customers-filtered.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- Static client-only content only; no customer records, analytics, cookies, uploads, or network calls are introduced.
- Story titles, company names, statistics, and logos are synthetic reference copy and must not be presented as verified customer claims without product/legal approval.

Authorization model:

- `/customers` is public. Story links are fixed same-origin paths; filters and pagination only mutate local state.
- No customer data or account entitlements are read or changed.

Threats considered:

- Cross-tenant data leakage if static cards are later replaced with real case-study records.
- Open redirects, XSS/unsafe markup, query construction, oversized filter input, and state race conditions.
- Accessible filtering, empty states, keyboard operation, and reduced-motion behavior.

Security controls implemented:

- Filter values are selected from bounded static arrays; result count is capped by a local page size and `slice`.
- Story links are built only from static company values; no browser-provided input reaches an href.
- React text rendering only; no unsafe DOM sinks, dynamic code, fetch, or third-party scripts.
- Selects and pagination expose labels and live result feedback; hover motion has a reduced-motion fallback.

Security tests added:

- `tests/customers.test.mjs` verifies the route, bounded filters/pagination, live results, CSS motion fallback, and unsafe-sink absence.
- Browser QA changed both filters, verified result counts, clicked “Show 3 more,” and captured clean/filtered screenshots.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- Targeted customer test — passed.
- `git diff --check` — passed after the final evidence and handoff edits.
- Impeccable detector was run for the new feature surface earlier in this turn; it reported only the existing editor-font warning and intentional grid advisory.

Checks not run:

- `npm test` — passed: 406 passed, 1 skipped, 0 failed; includes the production web build and the `/customers` route.
- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits remain unrun in this UI-only pass.
- Independent Claude security review remains required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Real customer-story integration requires verified content, authorization, privacy review, and tenant-scoped query tests.
- Full-page screenshot stitching can repeat the public chrome for long pages; the clean viewport and filtered screenshots provide the reliable visual evidence.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Features reference surface parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/features` route modeled on the captured Supademo feature landing page.
- Added a soft hero/preview, dark trust band, format tabs, team-audience tabs, and a final CTA using CSS-authored reference art.
- Exercised all twelve local feature/audience tab controls and captured complete/state screenshots with the local browser evidence.

Files changed:

- apps/web/app/features/page.tsx
- apps/web/components/marketing-features.tsx
- apps/web/app/globals.css
- tests/features.test.mjs
- browser-qa/supademo-local-2026-07-31/029-features-full.jpg
- browser-qa/supademo-local-2026-07-31/030-features-training.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- The page is static and client-only. It introduces no API calls, storage, uploads, analytics, cookies, or tenant records.
- Customer logos, trust wording, and feature descriptions are synthetic reference copy and are not evidence of live commercial claims.

Authorization model:

- `/features` is public. CTA links hand off to the existing sign-up/auth routes; tabs only change local UI state.
- No plan, account, or workspace entitlement is created or changed by this page.

Threats considered:

- Unsafe markup/DOM sinks, open redirects, URL interpolation, query injection, and accidental third-party calls.
- Keyboard operation and accessible state for two independent tablists.
- Motion and state changes that could be confusing under reduced-motion preferences.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, or network fetch.
- Tab controls use native buttons, `role="tab"`, `aria-selected`, controlled panels, and live state updates.
- CTA/navigation paths are fixed same-origin links.
- CSS-authored preview art contains no executable or user-provided content; audience/format state is bounded by static arrays.
- Reduced-motion media query removes decorative transition behavior.

Security tests added:

- `tests/features.test.mjs` verifies the route, expected hero, tab semantics, live state, reduced-motion CSS, and unsafe-sink absence.
- Browser QA activated all five format tabs and all seven audience tabs, verifying selected state and changed headings.

Checks run and results:

- `npm run verify` — passed after the feature implementation (format check, ESLint, workspace boundaries, and type checks).
- Targeted feature test — passed.
- Full `npm test` — passed: 406 passed, 1 skipped, 0 failed; includes `/features` and the later `/customers` route.
- `git diff --check` — passed after the final feature/docs/evidence edits and the customers addendum.
- Impeccable detector — run on the combined pricing/chrome/features/customers targets; it reported only the existing overused-font and intentional grid-background advisories, with no unsafe-code finding.

Checks not run:

- No additional repository check remains for this UI pass after the full test and diff checks above.
- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this UI-only turn; repository CI should run them before release.
- Independent Claude security review remains unavailable and required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The full-page browser screenshot utility duplicated the top public chrome while stitching this long page; DOM inspection confirmed one `main`, one hero, and one audience/CTA section. The viewport/state screenshot remains a clean visual reference.
- Feature art and claims are synthetic; wiring real captures, customer data, or analytics requires tenant authorization, privacy, and content-sanitization review.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Pricing reference surface parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/pricing` route modeled on the captured Supademo pricing reference.
- Added the shared public announcement/navigation chrome with native details menus, fixed same-origin entry links, and an active Pricing state.
- Added monthly/annual billing state, bounded creator-seat steppers, plan cards, comparison table, trust section, and CTA.
- Added reference screenshots and a control-action inventory to the local browser QA evidence folder.

Files changed:

- apps/web/app/pricing/page.tsx
- apps/web/components/marketing-pricing.tsx
- apps/web/components/marketing-chrome.tsx
- apps/web/app/globals.css
- tests/pricing.test.mjs
- browser-qa/supademo-local-2026-07-31/027-pricing-full.jpg
- browser-qa/supademo-local-2026-07-31/028-pricing-annual-scale-4.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- The page is a static, client-only marketing surface. It introduces no API calls, cookies, storage, uploads, analytics ingestion, or tenant data access.
- Pricing values, customer-logo text, comparison rows, and CTA copy are synthetic reference content pending product/legal confirmation; they must not be treated as billing entitlements.
- Links remain same-origin and do not interpolate user input.

Authorization model:

- `/pricing` is public and does not perform protected operations. Sign-up, login, and request-demo links hand off to the existing auth boundary.
- Creator-seat controls and billing toggle are local state only; they cannot create subscriptions, change entitlements, or mutate account data.

Threats considered:

- False billing or entitlement changes from client-side price controls.
- Open redirects, XSS/unsafe markup, query-string injection, and accidental third-party navigation.
- Keyboard/focus regressions in native menu details, billing switch, and stepper buttons.
- Motion accessibility and unbounded stepper input.

Security controls implemented:

- No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, remote fetch, or user-controlled URL construction.
- All stepper values are clamped to 1–10; buttons expose explicit labels and disabled boundary states.
- Billing switch uses `role="switch"`, `aria-checked`, and visible annual/monthly state.
- Native `<details>` menus preserve keyboard operation; pricing entry links are fixed same-origin paths.
- Card entry motion and toggle transitions have `prefers-reduced-motion` fallbacks.

Security tests added:

- `tests/pricing.test.mjs` verifies the route, plan copy, switch/stepper bounds, shared chrome, reduced-motion CSS, and absence of unsafe sinks.
- Browser QA verified the initial pricing render, annual billing transition, Scale creator increase, and all four creator-seat controls from a fresh render. Screenshots are stored in `browser-qa/supademo-local-2026-07-31/`.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- `npm test` — passed: 406 passed, 1 skipped, 0 failed; includes the production web build and the later `/features` and `/customers` routes.
- Impeccable detector — run on the combined pricing/chrome/features/customers targets; it reported only the existing overused-font and intentional grid-background advisories, with no unsafe-code finding.
- `git diff --check` — passed.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this UI-only turn; repository CI should run them before release.
- Independent Claude security review was not available and remains required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Pricing and trust content is visual reference data, not a live billing contract. Before production launch, replace it with server-authoritative plan/entitlement data and add billing authorization, tenancy, and payment-flow tests.
- The shared public chrome now exposes more discovered marketing paths through the existing static fallback; every future stateful route still requires its own authorization and security review.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Public route fallback coverage addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a catch-all public marketing route for discovered unimplemented slugs, with reserved application roots explicitly delegated to their existing routes or `notFound()`.
- Added a static, same-origin marketing fallback surface with bounded slug-to-copy mapping, no request-driven HTML, and shared header/footer navigation.
- Captured all 92 public reference paths locally under `browser-qa/supademo-local-route-crawl-2026-07-31` for visual route-availability comparison.

Files changed:

- apps/web/app/[...slug]/page.tsx
- apps/web/components/marketing-reference-page.tsx
- apps/web/app/globals.css
- tests/marketing-reference.test.mjs
- browser-qa/supademo-local-route-crawl-2026-07-31/README.md
- browser-qa/supademo-local-route-crawl-2026-07-31/manifest.json
- browser-qa/supademo-local-route-crawl-2026-07-31/*.jpg

Trust boundaries and sensitive data affected:

- The fallback is static and client-free; route segments affect only an allowlisted presentation mapping and escaped text.
- No external fetch, iframe, upload, analytics event, cookie, or tenant record is introduced by the catch-all route.

Authorization model:

- Reserved authenticated roots are rejected by the catch-all and remain owned by their existing route-level boundaries.
- Public fallback pages contain only same-origin links to the existing signup/product/auth surfaces; they do not grant authenticated access.

Threats considered:

- Route confusion or authenticated-route shadowing, reflected XSS through path segments, open redirects, SSRF, unsafe dynamic metadata, and accidental exposure of application pages.

Security controls implemented:

- A reserved-root set calls `notFound()` before rendering, preventing the fallback from handling `/app`, `/auth`, `/demos`, `/settings`, and other protected/product roots.
- Slugs are transformed into title text through a bounded segment formatter and rendered as escaped React text; no HTML or executable URL is assembled from the path.
- Links are fixed same-origin paths and the fallback does not read query strings or make network requests.

Security tests added:

- `tests/marketing-reference.test.mjs` verifies reserved-root handling, shared chrome, fallback content, responsive/reduced-motion CSS, and unsafe-sink absence.
- Browser QA captured 92/92 public reference paths locally with zero route errors.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed.
- `npm test` — passed: 403 passed, 1 skipped, 0 failed; includes the production web build.
- `git diff --check` — passed after the final documentation update.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits remain for repository CI.
- Independent Claude security review was not available in this environment and remains required by `AGENTS.md` before merge or release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The fallback prevents dead-end routes but is intentionally not an exact clone of proprietary Supademo article/customer/feature content or media.
- Some reference paths are known not-found pages or dynamic external content; the local manifest preserves the path coverage while the page body remains synthetic.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## App shell, UI laboratory, and local browser evidence addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Restyled the authenticated app shell to match the Supademo workspace hierarchy while retaining route-safe navigation, command-palette filtering, account-menu focus behavior, and sign-out handling.
- Replaced broken UI-lab image references with local CSS preview art and retained the Record → Edit → Share interaction journey.
- Preserved legacy `/app?section=` command destinations alongside the direct workspace routes.
- Captured complete local route screenshots and a non-destructive button inventory under `browser-qa/supademo-local-2026-07-31`.

Files changed:

- apps/web/components/app-shell.tsx
- apps/web/components/ui-lab.tsx
- apps/web/app/globals.css
- tests/app-shell.test.mjs
- tests/app-shell-overlays.test.mjs
- tests/ui-lab.test.mjs
- browser-qa/supademo-local-2026-07-31/README.md
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/*.jpg

Trust boundaries and sensitive data affected:

- The shell remains a client presentation/navigation boundary. Workspace selection and sign-out continue to call the existing authenticated clients; no tokens, cookies, or response bodies are rendered into the new chrome.
- UI-lab previews are CSS-only local art. No captured HTML, user content, external images, or executable markup is introduced.
- Browser evidence contains local screenshots and control labels only; no credentials, form submissions, downloads, or persistent writes were intentionally performed.

Authorization model:

- Direct navigation and command-palette links do not grant access; protected route/API enforcement remains server-side.
- Account settings and sign-out use the existing auth client. Workspace switching continues to use the existing workspace client and server authorization.
- The browser audit intentionally leaves authentication, account creation, uploads, exports, upgrades, publishing, and other ambiguous state-changing controls unsubmitted.

Threats considered:

- Tenant crossover through changed navigation/deep links, unsafe redirects from command palette entries, secret exposure in account chrome, unsafe DOM sinks in preview art, focus-trap regressions, and accidental side effects during browser QA.

Security controls implemented:

- Command targets are a fixed allowlist of same-origin paths; query values are not interpolated from free-form user input.
- Account and workspace controls retain semantic labels, keyboard focus management, and existing CSRF/auth client behavior.
- UI-lab preview content uses escaped React text and CSS pseudo-surfaces; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or dynamic code execution was added.
- Browser QA recorded safe activations separately from skipped side-effecting controls, with zero unclassified click timeouts after retry.

Security tests added or updated:

- `tests/app-shell.test.mjs` and `tests/app-shell-overlays.test.mjs` cover navigation, legacy section destinations, command palette, account menu, sign-out, and overlay lifecycle contracts.
- `tests/ui-lab.test.mjs` covers stage selection, accessible landmarks, responsive/reduced-motion rules, and unsafe-sink absence.
- Browser evidence records 26 local route/query surfaces, 174 visible buttons, 44 safe activations, 130 intentional skips, and zero unresolved click timeouts.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- `npm test` — passed: 402 passed, 1 skipped, 0 failed; includes the production web build.
- `git diff --check` — passed after the final documentation update.
- Browser QA — local route screenshots and control inventory completed; public reference crawl remains in `browser-qa/supademo-public-2026-07-31`.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits remain for repository CI.
- Independent Claude security review was not available in this environment and remains required by `AGENTS.md` before merge or release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Local workspace surfaces still use synthetic reference data and do not replace server-backed tenant data or editor/media persistence.
- Browser evidence intentionally does not activate state-changing controls; those flows require dedicated authenticated integration tests with disposable fixtures.
- Visual parity remains approximate where the source Supademo app uses proprietary assets or backend data.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Auth navigation and editor parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Successful sign-in and local auto-verified sign-up now route to the authenticated `/home` surface.
- Reworked the demo editor from unstyled utility-class markup into a responsive, keyboard-visible authoring layout with storyboard, canvas, inspector, read-only state, and local step/hotspot controls.
- Local sample demo routes now render three synthetic storyboard steps so the editor can be exercised without a backend record.

Files changed:

- apps/web/components/auth-screen.tsx
- apps/web/components/editor-shell.tsx
- apps/web/app/demos/[demoId]/edit/page.tsx
- apps/web/app/globals.css
- tests/auth-screen.test.mjs
- tests/editor-shell.test.mjs

Trust boundaries and sensitive data affected:

- Auth routing occurs only after the established auth client returns success; no credential or token is read by the UI.
- Editor sample content is static and local. Real demo documents continue to enter through the existing server/API boundary and existing read-only/authorization decision.
- Step titles and hotspot tooltip text are user-editable UI fields but are not executed as HTML, URLs, scripts, or commands.

Authorization model:

- The editor keeps the server-selected `readOnly` flag and disables title, tooltip, step, and hotspot mutations when read-only.
- Sign-in/sign-up uses the existing cookie/CSRF auth client and only redirects to `/home` after a successful response.

Threats considered:

- Redirecting before authentication, exposing credentials, unsafe HTML/URL sinks in editor text, mutation bypass through read-only UI state, and accidental sample data crossing into production storage.

Security controls implemented:

- Redirect is triggered only inside the successful auth branch; the server auth boundary remains authoritative.
- Editor fields render as escaped React text/input values; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, or dynamic code execution was added.
- Mutation buttons are absent or disabled in read-only mode, and synthetic sample documents are isolated to local `demo-*` route IDs.
- Editor transitions use short state feedback and include a `prefers-reduced-motion` fallback.

Security tests added:

- `tests/auth-screen.test.mjs` asserts successful auth routes to `/home`.
- `tests/editor-shell.test.mjs` asserts storyboard/canvas/inspector structure, accessible labels, hotspot controls, and absence of unsafe DOM sinks.
- Browser QA verified the styled editor at `/demos/demo-product-tour/edit` and exercised the route after the local sample document loaded.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed.
- Targeted editor/auth tests — passed.

Checks not run:

- Full `npm test` should be rerun after this addendum to include the latest editor/auth changes.
- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits remain for repository CI.
- Independent Claude security review remains required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The editor’s sample screen content is synthetic; real media rendering, upload validation, publishing, and tenant-scoped persistence remain outside this UI-only parity change.
- The auth redirect assumes the existing API’s success response and does not replace server-side session validation on protected routes.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Signup route addendum (2026-07-30)

Change summary:

- Added a dedicated `/signup` route that initializes the existing cookie-authenticated sign-up flow.
- Added an original responsive proof panel and explicit `/auth` login link.
- Updated marketing “Start for free” links to target `/signup`.

Files changed:

- apps/web/app/signup/page.tsx
- apps/web/components/auth-screen.tsx
- apps/web/components/marketing-chrome.tsx
- apps/web/app/globals.css
- tests/auth-screen.test.mjs

Trust boundaries and sensitive data affected:

- Email/password values remain in the existing browser-to-auth API boundary; the new route adds no storage, logging, OAuth provider, or third-party transfer.

Authorization model:

- Sign-up uses the existing `createAuthClient` implementation with `credentials: "include"`, CSRF token propagation, bounded response validation, and server-side account policy enforcement.

Threats considered:

- Credential exposure, unsafe redirects, XSS in route content, and accidental fake auth controls.

Security controls implemented:

- Fixed same-origin `/auth` navigation, no dynamic HTML, no credential logging, no new dependency, and robots exclusion for the auth surface.

Security tests added:

- Dedicated route source test verifies initial sign-up state, explicit login navigation, robots policy, and unsafe-DOM absence.

Checks run and results:

- `npm run format` passed.
- `npm run verify` passed.
- `npm test` passed: 398 passed, 1 skipped.
- Impeccable detector passed with no findings for changed signup targets.
- Browser QA confirmed `/signup` renders at desktop size and its login link navigates to `/auth`.

Checks not run:

- Claude independent security review was not available in this session; a human/Claude review remains required by repository policy.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The local browser API may be unavailable unless the configured API service is running; no real credentials were submitted during QA. Existing auth backend and provider configuration remain the source of truth.

## Authenticated home route addendum (2026-07-30)

Change summary:

- Added the authenticated `/home` workspace surface based on the supplied Supademo reference.
- Added fixed workspace navigation, featured update shelf, tabbed demo cards, goal lessons, upgrade card, bounded local search filtering, and dismiss/restore behavior.
- Added a post-auth “Continue to workspace” link to `/home`.

Files changed:

- apps/web/app/home/page.tsx
- apps/web/components/home-workspace.tsx
- apps/web/components/auth-screen.tsx
- apps/web/app/globals.css
- tests/home-sections.test.mjs

Trust boundaries and sensitive data affected:

- The route is a client-rendered presentation surface. It does not fetch, persist, or expose tenant data; the visible names and demo cards are local reference content.
- Search state is bounded to the input value and used only for in-memory text matching.

Authorization model:

- `/home` is an authenticated workspace destination by product flow; the route itself adds no API mutation or authorization decision. Existing server/session middleware remains responsible for protecting workspace data and operations.
- All navigation targets are fixed same-origin paths; no user-controlled redirect or outbound URL was introduced.

Threats considered:

- Reflected/stored XSS through search and demo labels, open redirects, secret exposure, accidental API calls, and cross-tenant data reads.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic fetch, or external embeds.
- Local search filtering is bounded and does not become a URL, query, HTML fragment, or server authorization input.
- Robots exclusion remains enabled for the authenticated route; controls use native links/buttons with accessible tab state.

Security tests added:

- `tests/home-sections.test.mjs` verifies the route metadata, reference content, tab/search/dismiss contracts, fixed `/home` auth destination, and absence of unsafe DOM/dynamic-code APIs.

Checks run and results:

- `npm run verify` — passed.
- `npm test` — passed: 399 passed, 1 skipped, 0 failed; includes production web build.
- Impeccable detector on changed home/auth/frontend targets — passed with no findings.
- Browser QA at `http://localhost:3000/home` — route rendered; tab selection updated `aria-selected`; search filtered cards; desktop screenshot reviewed.

Checks not run:

- Gitleaks, Semgrep, Trivy/container, IaC, and dependency audit were not re-run for this UI-only change; no dependency, infrastructure, or server endpoint changed. Run repository CI scanners before release.
- Independent Claude security review was not available in this environment and remains required by `AGENTS.md` before merge or release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The page currently uses synthetic local demo thumbnails and reference copy until real workspace APIs/assets are connected.
- `/home` does not itself enforce authentication in the page component; deployment must retain the existing authenticated route/middleware boundary before exposing real workspace data.

## Authenticated reference workspace routes addendum (2026-07-30)

Change summary:

- Added Supademo-inspired authenticated presentation surfaces for `/demos`, `/videos`, `/showcases`, `/hubs`, `/routes`, and `/analytics`.
- Added the screenshot state as a working segment on `/demos`, shared workspace rail/top bar navigation, reference cards, route-hub call-to-action, and analytics preview tables/charts.

Files changed:

- apps/web/components/workspace-reference-surface.tsx
- apps/web/app/demos/page.tsx
- apps/web/app/videos/page.tsx
- apps/web/app/showcases/page.tsx
- apps/web/app/hubs/page.tsx
- apps/web/app/routes/page.tsx
- apps/web/app/analytics/page.tsx
- apps/web/components/home-workspace.tsx
- apps/web/app/globals.css

Trust boundaries and sensitive data affected:

- These surfaces currently render bounded local reference content and make no API, storage, upload, analytics, or third-party requests.
- Search and navigation controls do not pass user input to a server, URL, authorization decision, or dynamic HTML sink.

Authorization model:

- The routes are presentation destinations in the authenticated workspace flow; existing authentication/session middleware and server-side authorization remain responsible for access control.
- No new tenant-owned lookup, mutation, publish, export, or share operation was introduced.

Threats considered:

- Cross-tenant data exposure, XSS through card/search content, open redirects, secret leakage, unsafe external embeds, and accidental authorization decisions in client code.

Security controls implemented:

- React text rendering only; no unsafe DOM APIs, dynamic code execution, or remote data fetching.
- Fixed same-origin navigation targets and bounded static reference datasets.
- Route metadata excludes authenticated surfaces from indexing.

Security tests added:

- Existing route/source and workspace UI tests continue to cover the legacy demo surface and navigation contracts. New routes were verified by HTTP smoke checks for status and expected landmark text.

Checks run and results:

- `npm run verify` — passed.
- `npm test` — passed: 399 passed, 1 skipped, 0 failed.
- Impeccable detector — two non-blocking warnings for intentional tab underline borders with zero-radius tabs (`globals.css` lines 358 and 600); no unsafe-code findings.
- HTTP smoke QA against `http://localhost:3000`: all six routes returned 200 and exposed expected landmarks (`Team Supademos`, `No videos yet`, `Team Showcases`, `Demo Hub`, `Welcome to Route Hub`, `Supademo Views`, `Most Viewed`).

Checks not run:

- In-app browser automation could not be reattached because the privileged browser bridge was unavailable in this session. Gitleaks, Semgrep, Trivy/container, IaC, and dependency audits were not re-run for this UI-only change. Independent Claude security review was unavailable and remains required by repository policy.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Thumbnails, chart data, table rows, and showcase examples are synthetic reference content; connecting real workspace APIs requires re-validating tenant scoping, authorization, pagination, and analytics privacy.
- The page components themselves do not enforce authentication; deployment must preserve the existing authenticated boundary before real data is wired in.

## Local authentication and session wiring addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a local/test-only auth provider so the development web command starts a functional API and auth workflow together.
- Added bounded local account creation/sign-in using scrypt password verification, automatic local verification, opaque server sessions, and CSRF tokens.
- Made bodyless refresh/sign-out requests valid, rotated the active session on refresh, and allowed stale cookies to fall through public sign-up/sign-in while protected requests still fail closed.
- Updated the sign-up screen to enter the signed-in state when the local provider confirms an account immediately.

Files changed:

- packages/auth/src/index.ts
- apps/api/src/local-auth-provider.ts
- apps/api/src/index.ts
- apps/api/src/app.ts
- apps/web/components/auth-screen.tsx
- scripts/dev-web.mjs
- package.json
- tests/auth.test.mjs
- tests/auth-screen.test.mjs
- tests/api.test.mjs

Trust boundaries and sensitive data affected:

- Browser credentials cross the local web proxy into the local API. Passwords are accepted only at the auth boundary, hashed in memory with scrypt, and never returned or logged.
- Local accounts and sessions are process-memory state and are available only when the loaded configuration selects the local provider; production provider configuration is unchanged.
- Session identity stays server-side behind an HttpOnly cookie; the browser receives only a bounded CSRF token for unsafe requests.

Authorization model:

- Public sign-up/sign-in create or authenticate a local identity and issue a server session.
- Refresh requires the current active session cookie plus its CSRF token, revokes the old session, and issues a new cookie/token pair for the same verified identity.
- Sign-out accepts an empty body, but an active cookie session still requires its CSRF token. Protected routes continue to authenticate through the server session and existing authorization checks.

Threats considered:

- Stale-cookie denial of service on public auth operations, session fixation or account confusion during refresh, CSRF, password exposure, user enumeration, weak local credentials, and accidental production use of the development adapter.

Security controls implemented:

- Local provider is selected only by explicit local/test configuration; it is not a production identity provider.
- Passwords use random per-account salts and scrypt; comparison uses timing-safe equality and errors are generic.
- Sessions are opaque, expiring, revocable, and rotated on refresh; CSRF validation applies to active cookie sessions.
- Auth rate limiting and existing input schemas remain in the workflow; bodyless operations do not parse an absent JSON body.
- A stale or revoked cookie is ignored by the public auth CSRF gate, while protected endpoints still require a live session.

Security tests added:

- Local account creation, duplicate handling, wrong-password rejection, and password non-disclosure in `tests/auth.test.mjs`.
- Sign-up UI handling for immediate local verification in `tests/auth-screen.test.mjs`.
- Anonymous refresh rejection, refresh rotation, bodyless sign-out, and stale-cookie sign-up regression coverage in `tests/api.test.mjs`.

Checks run and results:

- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- `npm test` — passed: 401 passed, 1 skipped, 0 failed; includes the production web build.
- Targeted auth/API tests — passed: 23 passed, 0 failed.
- Direct local HTTP smoke flow — sign-up, sign-in, refresh, and bodyless sign-out returned 200; anonymous refresh returned 401.

Checks not run:

- Gitleaks, Semgrep, Trivy/container, IaC, and dependency audits were not re-run in this turn; run repository CI scanners before release.
- Independent Claude security review was not available in this environment and remains required by `AGENTS.md` before merge or release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The local provider keeps accounts in process memory, auto-verifies without email delivery, and is not suitable for production or multi-process development.
- Production still requires the configured managed identity provider to be injected at startup; no production credentials or identity-provider permissions were added.

## Workspace reference surfaces parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a static, client-only reference implementation for the authenticated Demos, Screenshots, Videos, Showcases, Demo Hub, Route Hub, and Analytics surfaces.
- Added shared workspace navigation, local tab/filter/sort/layout states, authored preview art, route-graph preview dialog behavior, analytics tables/charts, and reduced-motion-safe entry/state transitions.
- Corrected the Demos segmented control so selecting Screenshots switches to the screenshot feature surface and heading.
- Added new icon primitives used by the workspace shell and collection controls.

Files changed:

- apps/web/components/workspace-reference-surface.tsx
- apps/web/components/home-workspace.tsx
- apps/web/app/globals.css
- packages/ui/src/icons.tsx
- packages/ui/src/index.ts
- tests/home-sections.test.mjs

Trust boundaries and sensitive data affected:

- These surfaces currently use static reference content and local component state only. No new network request, storage, upload, analytics ingestion, authentication, cookie, or tenant-data boundary was introduced.
- Any future replacement of the synthetic rows, thumbnails, charts, map, or route graph with workspace data will cross the existing authenticated API boundary and must re-validate tenant scope, authorization, pagination, and privacy controls.

Authorization model:

- The components do not create or weaken authorization. They are rendered behind the existing application routing/authentication boundary, and all current controls perform local UI state changes only.
- The route preview dialog is a local preview and does not publish, share, mutate, or grant access to a resource.

Threats considered:

- Cross-tenant data exposure if static examples are later replaced by API data.
- XSS or script execution through demo/search/query content, unsafe DOM sinks, or authored preview markup.
- Open redirects, SSRF, command injection, upload handling, CSRF, secret exposure, and analytics privacy regressions.
- Focus loss, keyboard traps, and motion-triggered accessibility regressions in overlays and state transitions.

Security controls implemented:

- Preview links encode the local demo identifier with `encodeURIComponent`; no user-controlled HTML is injected or executed.
- No `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `eval`, dynamic `Function`, or client-side fetch was added in the reference surface.
- Dialog, buttons, tabs, tables, and status feedback use semantic roles/labels; route preview closes through an explicit button and Escape handling.
- Motion is limited to page/state relationships and disabled under `prefers-reduced-motion`.
- Existing authenticated/API/CSRF controls remain unchanged.

Security tests added:

- `tests/home-sections.test.mjs` covers the new headings, table/chart sections, route preview CTA, analytics filter affordance, and motion/reduced-motion selectors.
- Browser QA exercised the Demos, Screenshots, Videos, Showcases, Demo Hub, Route Hub, Analytics, Auth, and Signup surfaces, including the Screenshots segment and Route Hub preview dialog.

Checks run and results:

- `npm run format` — passed.
- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- `npm test` — passed: 401 passed, 1 skipped, 0 failed; includes the production web build.
- `git diff --check` — passed.
- Impeccable detector was run once on the changed UI files. The remaining grid-background advisory is intentional for the route graph canvas; the rounded active-tab border warning was reduced to a 2px border.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this turn; repository CI should run them before release.
- An independent Claude security review was not available in this environment and remains required by `AGENTS.md` before merge or release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Thumbnails, chart values, table rows, map shading, route nodes, and showcase examples are synthetic reference content; no real workspace records are loaded yet.
- Visual parity is approximate where the source site uses proprietary image assets or server-backed data. Connecting real data requires a separate security review with cross-tenant negative tests.
- The app must continue to enforce authentication before these surfaces are exposed in a production deployment.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.

## Compare landing page reference surface parity addendum (2026-07-31)

SECURITY REVIEW REQUEST

Change summary:

- Added a dedicated `/compare` route modeled on the captured Supademo alternatives page.
- Added the comparison hero, trust/awards band, four reason cards, bounded comparison-category tabs, show-more control, feature carousel, FAQ disclosures, CTA, and shared public footer.
- Added browser evidence for the default page and a Video/next-slide/FAQ state.

Files changed:

- apps/web/app/compare/page.tsx
- apps/web/components/marketing-compare.tsx
- apps/web/app/[...slug]/page.tsx
- apps/web/app/globals.css
- tests/compare.test.mjs
- browser-qa/supademo-local-2026-07-31/040-compare-full.jpg
- browser-qa/supademo-local-2026-07-31/041-compare-video-next-faq.jpg
- browser-qa/supademo-local-2026-07-31/manifest.json
- browser-qa/supademo-local-2026-07-31/button-actions.json
- browser-qa/supademo-local-2026-07-31/README.md

Trust boundaries and sensitive data affected:

- The page is public and client-only. Copy, comparison cards, awards, and preview art are static repository-owned content; no customer records, cookies, uploads, analytics, or network calls are introduced.
- Category, carousel, show-more, and FAQ state is bounded local UI state. Static comparison slugs are the only values interpolated into same-origin routes.

Authorization model:

- `/compare` is intentionally anonymous. CTAs navigate to existing public/auth boundaries, while comparison-card links remain public same-origin reference routes and do not access or mutate workspace data.
- The route is reserved from the generic fallback so a missing comparison route cannot expose a different page category.

Threats considered:

- XSS/unsafe markup, open redirects, URL interpolation, query injection, unbounded list expansion, accidental external calls, and disclosure/carousel state races.
- Keyboard tab semantics, disabled carousel bounds, show-more behavior, native FAQ disclosure, and reduced-motion behavior.

Security controls implemented:

- React text rendering only; no `dangerouslySetInnerHTML`, `innerHTML`, `eval`, dynamic `Function`, fetch, or external script was added.
- Comparison category state is constrained to the static category list; show-more and carousel indices are clamped to static array bounds.
- Comparison links interpolate only static slugs into same-origin paths. CTAs use fixed literals.
- Native buttons/tabs/details expose accessible selected and disabled states; comparison cards use keyboard-focusable anchors; card motion has a reduced-motion fallback.

Security tests added:

- `tests/compare.test.mjs` verifies the route, bounded comparison tabs, show-more/carousel controls, FAQ markup, safe static links, reduced-motion CSS, and unsafe-sink absence.
- Browser QA exercised all six comparison tabs, show-more, Previous, Next, and a FAQ disclosure; screenshots are stored in `browser-qa/supademo-local-2026-07-31/`.

Checks run and results:

- `npm run verify` — passed (format check, ESLint, workspace boundaries, and type checks).
- Targeted compare test — passed.
- Browser QA — passed for all category tabs, show-more, carousel bounds, FAQ disclosure, and screenshot capture.
- Impeccable detector — run on the new compare TSX targets; no findings.
- Full `npm test` — passed: 411 passed, 1 skipped, 0 failed (412 tests total); includes the production web build and `/compare`.
- `git diff --check` — pending after this final handoff/evidence formatting edit; run before merge.

Checks not run:

- Gitleaks, Semgrep/CodeQL, Trivy/container, IaC, license, and dependency audits were not run in this UI-only pass; repository CI should run them before release.
- Independent Claude security review remains unavailable and required by `AGENTS.md`.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Awards, ratings, customer numbers, and comparison copy are synthetic reference content; product/legal approval is required before presenting them as verified commercial claims.
- Deeper `/compare/*` alternative pages still need their own functional parity pass before the public comparison library can be considered complete.
- Wiring real competitor data, analytics, or external CTAs requires a separate privacy, tenant-isolation, dependency, and outbound-request review.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
