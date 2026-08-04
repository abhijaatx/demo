# Security Review Handoff — Demo Hub feature page

SECURITY REVIEW REQUEST

Change summary:

- Replaced the generic `/features/demo-hub` fallback with a reference-oriented Demo Hub page.
- Added the Supademo-style dotted hero, fixed interactive-demo preview, live-example cards, trust rail, product-tour comparison, guidance steps, feature directory, FAQ disclosures, and launcher affordance.
- Added responsive layouts, reduced-motion behavior, and keyboard-operable disclosure/category controls.

Files changed:

- `apps/web/components/marketing-feature-detail.tsx`
- `apps/web/app/globals.css`
- `apps/web/public/demo-hub-hero.jpg`
- `apps/web/public/demo-hub-hero-source.jpg`
- `tests/marketing-reference.test.mjs`
- `docs/reviews/TASK-209-demo-hub-security-handoff.md`
- `browser-qa/local-fidelity-2026-08-02/reference-demo-hub-top-v4.jpg`
- `browser-qa/local-fidelity-2026-08-02/reference-demo-hub-canvas.jpg`
- `browser-qa/local-fidelity-2026-08-02/reference-demo-hub-trust.jpg`
- `browser-qa/local-fidelity-2026-08-02/reference-demo-hub-compare.jpg`
- `browser-qa/local-fidelity-2026-08-02/reference-demo-hub-guide.jpg`
- `browser-qa/local-fidelity-2026-08-02/reference-demo-hub-faq.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-demo-hub-top-final.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-demo-hub-2603-final.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-demo-hub-3686-final.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-demo-hub-4936-final.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-demo-hub-5521-final.jpg`
- `browser-qa/local-fidelity-2026-08-02/local-demo-hub-mobile.jpg`

Trust boundaries and sensitive data affected:

- This is a public, unauthenticated marketing route. It renders fixed product copy, a locally stored preview image captured from the reference canvas, and fixed HTTPS logo/illustration assets.
- No workspace, viewer, lead, analytics, account, credential, or uploaded content is read or written.
- CTA links enter existing local signup/product-demo routes; no new API or server action was introduced.

Authorization model:

- No protected operation was added. The page is public and informational.
- Signup/product-demo CTAs use fixed local paths and rely on the existing authentication and authorization flows after navigation.
- Example and category links do not grant access to customer data or privileged actions.

Threats considered:

- XSS or injection through feature copy, FAQ text, category labels, and example descriptions.
- Open redirects or attacker-controlled navigation from feature/example links.
- Unsafe third-party resource loading and accidental iframe/script execution.
- Dead or inaccessible controls around disclosures, category selection, and FAQ interaction.
- Mobile overflow and reduced-motion accessibility regressions.

Security controls implemented:

- All displayed strings, destinations, and external asset URLs are compile-time constants; no untrusted HTML is rendered.
- The page uses native `<details>/<summary>` disclosures with bounded, static category links and FAQ content.
- All remote images use fixed HTTPS Supademo origins and `referrerPolicy="no-referrer"`; the preview image is served from the local app rather than embedding a remote iframe.
- No dynamic redirects, URL interpolation, `innerHTML`, `eval`, or executable user content was added.
- Responsive CSS prevents horizontal overflow and reduced-motion CSS disables transitions/animations.

Security tests added:

- `tests/marketing-reference.test.mjs` asserts Demo Hub copy, data arrays, local preview asset, feature links, and dedicated page/CSS selectors.
- Browser smoke coverage navigated the hero CTA anchor, opened the trust-category disclosure, used a category link, opened a non-default FAQ, and verified an example card navigated to `/signup`.
- Browser geometry checks matched the reference section boundaries within a few pixels at the 1280px viewport; a 390px viewport reported no horizontal overflow.

Checks run and results:

- `npx prettier --write apps/web/components/marketing-feature-detail.tsx apps/web/app/globals.css tests/marketing-reference.test.mjs` — passed.
- `node --test tests/marketing-reference.test.mjs tests/features.test.mjs` — 2 passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run check:boundaries` — passed.
- `git diff --check` — passed.
- `npm audit --omit=dev --audit-level=high` — passed; 0 vulnerabilities.

Checks not run:

- Full `npm test` was not rerun in this page pass because the repository has known unrelated dashboard benchmark, API placeholder, and worker-start scaffold failures documented in earlier handoffs. Run `npm test` in CI and triage those failures separately.
- No authenticated tenant-isolation/API security test applies: this route adds no API and no tenant-owned data access.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The hero preview is a static local capture of the public reference canvas, so it does not execute a live Demo Hub tour. The CTA still routes into the existing signup flow.
- Trust/logo/FAQ illustrations depend on fixed public Supademo-hosted assets; availability is an external rendering dependency.
- The generated source image `apps/web/public/demo-hub-hero-source.jpg` is an intermediate copy of the browser capture and should be removed before release if only the cropped preview is desired.
- Repository-level Claude review remains required by `AGENTS.md` before merge.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
