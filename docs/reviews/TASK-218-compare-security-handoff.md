# TASK-218 Security Handoff

SECURITY REVIEW REQUEST

Change summary:

- Matched the public Compare page to the Supademo reference at the review viewport, including the hero grid, trust rail, alternating reason rows, comparison cards, case studies, feature carousel, FAQ rail, and CTA surface.
- Replaced placeholder award marks and trust logos with fixed public Supademo assets.
- Added a bounded trust-category picker and preserved bounded comparison/category/carousel interactions.

Files changed:

- `apps/web/components/marketing-compare.tsx`
- `apps/web/app/globals.css`
- `tests/compare.test.mjs`
- `docs/reviews/TASK-218-compare-security-handoff.md`

Trust boundaries and sensitive data affected:

- Public marketing content and remote image requests to `supademo.com`.
- Local comparison links under `/compare/[slug]`, public CTA links, and in-page controls.
- No authenticated data, tenant records, uploads, analytics, secrets, or third-party credentials are introduced.

Authorization model:

- The page is public. Category, trust-picker, show-more, carousel, and FAQ state is presentation-only client state.
- All comparison destinations and asset paths come from repository-owned literals; no user input is interpolated into URLs or rendered as markup.

Threats considered:

- Open redirects or URL injection through comparison cards, CTAs, or trust categories.
- XSS from competitor names, trust labels, and static copy.
- Remote asset/referrer leakage and failed image loads.
- Unbounded DOM growth through show-more or category controls.

Security controls implemented:

- Static allowlists for comparison data, trust categories, logos, and feature assets.
- Local route templates and fixed `/signup`, `/pricing`, `/features`, `/use-cases`, `/customers`, and `/product-demo` destinations.
- Remote image requests use `referrerPolicy="no-referrer"`; no unsafe DOM sinks or dynamic code execution are used.
- Show-more is bounded by the static comparison array; carousel indices clamp to the visible feature range.
- Trust picker uses button/listbox semantics with a fixed option set; FAQ uses native `details` disclosure.
- Reduced-motion CSS disables card transitions.

Security tests added:

- `tests/compare.test.mjs` checks route wiring, fixed assets, bounded controls, trust-picker semantics, split comparison cards, feature track, reduced-motion CSS, and unsafe-sink exclusion.
- Browser validation exercised the trust picker, comparison tabs, bounded show-more behavior, next/previous carousel controls, comparison-card navigation, and FAQ disclosure.

Checks run and results:

- `node --test tests/compare.test.mjs tests/integrations.test.mjs tests/customers.test.mjs tests/industry.test.mjs tests/use-cases.test.mjs tests/marketing-reference.test.mjs tests/pricing.test.mjs` — passed.
- `npm run lint` — passed.
- `npm run typecheck` — passed.
- `npm run check:boundaries` — passed.
- `git diff --check` — passed.
- `npm audit --omit=dev --audit-level=high` — passed; 0 vulnerabilities reported.

Checks not run:

- Claude's independent security review — no Claude review tool is available in this environment; this handoff must be reviewed before merge.
- Dynamic, secret, container, and infrastructure scanners — no configured commands were available for this static public-route change; run CI equivalents before release.

Dependencies or infrastructure permissions added:

- None.

Known limitations and residual risks:

- Public vendor/award assets and copy are fetched from Supademo's public origin and may change independently of this repository.
- Comparison detail routes are separate work; this page only emits fixed local links to those routes.
- The trust picker changes presentation label/state; it does not claim to filter sensitive analytics or customer data.

Please review the full diff and surrounding code for OWASP Top 10, tenant isolation,
authentication/authorization, input validation, XSS, SSRF, injection, upload safety,
secret exposure, privacy, dependency risk, insecure cloud configuration, and missing
negative tests. Classify findings as BLOCKER, HIGH, MEDIUM, LOW, or NOTE.
