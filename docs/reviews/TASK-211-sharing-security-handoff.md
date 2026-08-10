SECURITY REVIEW REQUEST

Change summary:

- Added a reference-matched public Sharing feature page at `/features/sharing`.
- Added the Sharing hero, eight sharing capability rows, feature directory, FAQ disclosures, trust rail, and footer CTA.
- Added a Sharing-specific public navigation variant so header spacing and Login/CTA behavior match the reference page.
- Added responsive layout and reduced-motion rules for the new page.

Files changed:

- `apps/web/components/marketing-feature-detail.tsx`
- `apps/web/components/marketing-chrome.tsx`
- `apps/web/app/globals.css`
- `tests/marketing-reference.test.mjs`
- `docs/reviews/TASK-211-sharing-security-handoff.md`

Trust boundaries and sensitive data affected:

- This is a public, static marketing route. It does not read workspace data, viewer data, credentials, or authenticated browser state.
- The page references externally hosted Supademo images and links to existing local signup, login, product-demo, and feature routes.
- Native FAQ disclosures change only local DOM state; no user input is persisted or transmitted.

Authorization model:

- The route is intentionally unauthenticated and contains no privileged operation.
- CTAs navigate to existing authentication or product-demo flows, where authorization and CSRF controls remain enforced by those routes.

Threats considered:

- XSS or injection through marketing copy, FAQ text, tag labels, and URL targets.
- Accidental exposure of authenticated content through external image requests.
- Open redirects or unsafe URL construction from CTA and directory links.
- Keyboard/focus regressions and motion-related accessibility failures.

Security controls implemented:

- All content and links are static, repository-controlled literals; no `dangerouslySetInnerHTML`, dynamic code execution, or user-controlled URL interpolation is used.
- External images use `referrerPolicy="no-referrer"` and are rendered as ordinary images rather than executable embeds.
- CTA and directory destinations are fixed same-origin paths or vetted existing Supademo image URLs.
- Native `<details>` FAQ controls preserve browser keyboard and disclosure semantics.
- Reduced-motion media rules disable Sharing-page animations and transitions when requested by the user agent.

Security tests added:

- `tests/marketing-reference.test.mjs` asserts Sharing route structure, copy, asset references, FAQ semantics, and the absence of unsafe HTML/eval patterns across the public marketing surface.
- Browser verification exercised all Sharing CTA links and every FAQ disclosure; each CTA reached its expected local route and each disclosure toggled without a network mutation.

Checks run and results:

- `npx prettier --write apps/web/components/marketing-chrome.tsx apps/web/components/marketing-feature-detail.tsx apps/web/app/globals.css` — passed.
- Browser screenshot capture at 1280px for hero, feature rows, explore directory, FAQ, trust rail, and footer — passed.
- Browser CTA and FAQ interaction checks — passed.

Checks not run:

- Full `npm test` was not rerun in this pass because the repository contains known unrelated long-running/failing benchmark and scaffold suites; run `npm test` in CI before merge and triage any failures outside this page.
- Dependency, secret, SAST, container, and infrastructure scanners were not available through the local workflow; run the repository's configured security pipeline before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- The page depends on externally hosted reference images; availability and content changes at that origin can affect visual fidelity, though no credentials are sent with those requests.
- The destination routes linked by CTAs must continue to enforce their own authentication and authorization controls.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
