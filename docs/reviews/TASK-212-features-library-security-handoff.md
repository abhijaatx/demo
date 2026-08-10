SECURITY REVIEW REQUEST

Change summary:

- Matched the public `/features` library hero/header geometry to the live reference.
- Replaced the format tab panel with the reference three-up feature carousel using the live card copy and image set.
- Added bounded Previous/Next controls, disabled-state handling, smooth motion, and reduced-motion support.

Files changed:

- `apps/web/components/marketing-features.tsx`
- `apps/web/app/globals.css`
- `tests/marketing-reference.test.mjs`
- `docs/reviews/TASK-212-features-library-security-handoff.md`

Trust boundaries and sensitive data affected:

- The page is a public marketing route and does not read or write workspace, viewer, analytics, or account data.
- Card images are external public Supademo assets; carousel state is local React state only.

Authorization model:

- No privileged operation was added. The route is intentionally unauthenticated.
- Existing signup/product-demo links remain navigation-only and delegate access control to their destination routes.

Threats considered:

- XSS or injection through feature copy, image URLs, and CTA targets.
- Open redirects or unsafe URL construction.
- Unbounded carousel state, keyboard/focus regressions, and motion accessibility issues.
- Accidental credential/referrer exposure in external image requests.

Security controls implemented:

- Feature data and hrefs are repository-controlled literals; no user-controlled interpolation, unsafe HTML, or dynamic code execution.
- Carousel index is clamped to the valid range and controls expose native `disabled` semantics.
- Images use `referrerPolicy="no-referrer"`; they are not iframes or executable content.
- Buttons use native keyboard semantics and visible focus styles; reduced-motion rules remove transitions.

Security tests added:

- `tests/marketing-reference.test.mjs` asserts the feature carousel structure, reference assets, and navigation labels while retaining unsafe-DOM regression assertions.
- Browser verification exercised Next and Previous, confirmed disabled-state transitions, and restored the initial card position.

Checks run and results:

- `node --test tests/marketing-reference.test.mjs` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run check:boundaries` — passed.
- `git diff --check` — passed.
- `npm audit --omit=dev --audit-level=high` — 0 vulnerabilities reported.
- Browser screenshot and carousel interaction checks at 1280px — passed.

Checks not run:

- Full `npm test` was not rerun because the repository contains known unrelated long-running/failing benchmark and scaffold suites; run it in CI before merge.
- Secret, SAST, container, and infrastructure scanners were not available in the local workflow; run the configured security pipeline before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Visual fidelity depends on the availability and unchanged content of externally hosted reference images.
- Downstream CTA routes must continue enforcing their own authentication and authorization controls.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
