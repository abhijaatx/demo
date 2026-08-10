SECURITY REVIEW REQUEST

Change summary:

- Matched the public `/pricing` header overlay, Login placement, and CTA geometry to the live reference.
- Preserved the existing pricing controls and plan-grid behavior while aligning the desktop plan container width.

Files changed:

- `apps/web/components/marketing-pricing.tsx`
- `apps/web/app/globals.css`
- `docs/reviews/TASK-213-pricing-security-handoff.md`

Trust boundaries and sensitive data affected:

- Public pricing content only; no workspace, account, billing credentials, or payment data is read or stored by this change.
- Billing toggle and creator-count controls remain local UI state and do not create charges.

Authorization model:

- The page is intentionally public. Plan trial CTAs navigate to the existing signup/product-demo flows, where authentication and entitlement checks remain enforced.

Threats considered:

- Misleading or bypassable billing controls, unsafe URL targets, injection through plan copy, and keyboard accessibility regressions.

Security controls implemented:

- Header and plan links use repository-controlled same-origin or approved signup/product-demo paths.
- Existing pricing calculations remain bounded by their current min/max controls; no server-side entitlement behavior was changed.
- Native buttons and links retain keyboard semantics and visible focus styling.

Security tests added:

- Browser verification exercised the pricing route and confirmed header geometry against the live reference; existing pricing control tests remain applicable.

Checks run and results:

- `npx prettier --write apps/web/components/marketing-pricing.tsx apps/web/app/globals.css` — passed.
- Browser screenshot geometry checks at 1280px — passed (hero/nav/plan start positions align with the reference).

Checks not run:

- Full `npm test` was not rerun because of known unrelated long-running/failing benchmark and scaffold suites; run it in CI before merge.
- Secret, SAST, container, and infrastructure scanners were not available in the local workflow; run the configured security pipeline before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Pricing content and externally hosted assets can change independently of this repository.
- CTA destinations must continue enforcing signup, billing, and entitlement policies server-side.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
